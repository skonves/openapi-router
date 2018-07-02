import * as express from 'express';
import {
  OpenAPI,
  RequestValidationResult,
  ResponseValidationError,
  ResponseOptions,
} from './types';

import {
  Validator as JsonValidator,
  ValidatorResult as JsonValidatorResult,
} from 'jsonschema';
import { DefinedValuesStep } from './pipeline/defined-values-step';
import { DefaultValuesStep } from './pipeline/default-values-step';
import { PreCastStep, preCast } from './pipeline/pre-cast-step';
import { PostCastStep } from './pipeline/post-cast-step';
import { ValidateStep } from './pipeline/validate-step';
import { IPipeline } from './pipeline/types';
import { RequestPipeline } from './pipeline/request-pipeline';
import { getValuesFromRequest } from './express-utility';

export class Validator {
  constructor(
    operationId: string,
    private spec: OpenAPI.Schema,
    options?: ResponseOptions,
  ) {
    this.operation = getOperation(operationId, spec);
    this.parameters = getParameters(this.operation, spec);
    this.jsonValidator = new JsonValidator();
    this.jsonValidator.addSchema(spec, '/');

    this.ignoreInvalidHeaders = options && !!options.ignoreInvalidHeaders;
    this.ignoreMissingHeaders = options && !!options.ignoreMissingHeaders;
    this.ignoreInvalidBody = options && !!options.ignoreInvalidBody;
    this.ignoreInvalidStatus = options && !!options.ignoreInvalidStatus;

    this.pipeline = new RequestPipeline(
      new DefinedValuesStep(this.parameters),
      new DefaultValuesStep(this.parameters),
      new PreCastStep(this.parameters),
      new ValidateStep(this.parameters, this.spec),
      new PostCastStep(this.parameters),
    );
  }

  validateRequest(req: express.Request): RequestValidationResult {
    const values = getValuesFromRequest(req, this.parameters);
    return this.pipeline.excecute(values);
  }

  validateResponse(res: express.Response, bodyArgs) {
    const response = this.getResponse(res.statusCode);

    if (response) {
      // Route found
      const headers = res.getHeaders();
      const headerDefinitions = response.headers || {};
      const contentType = parseContentType(headers['content-type']);
      const mimeType = contentType.mimeType;
      const encoding = (contentType.charset || '').replace('-', '');
      const data = Object.keys(bodyArgs)
        .map(key => bodyArgs[key])
        .filter(x => x)[0];
      const body = data ? parseBodyData(mimeType, encoding, data) : undefined;

      const headerErrors: ResponseValidationError[] = Object.keys(
        headerDefinitions,
      )
        .map(name => ({
          name,
          headerDefinition: headerDefinitions[name],
        }))
        .map(header => ({
          name: header.name,
          values: Array.isArray(headers[header.name])
            ? (headers[header.name] as string[])
            : [headers[header.name] as number | string | undefined],
          headerDefinition: header.headerDefinition,
        }))
        .reduce((array, item) => {
          return array.concat(
            item.values.map(value => ({
              name: item.name,
              value: preCast(value, item.headerDefinition),
              spec: item.headerDefinition,
            })),
          );
        }, [])
        .map(header =>
          this.validateValue(header.value, header.spec).errors.map(x => ({
            type: 'INVALID_HEADER',
            name: header.name,
            value: header.value,
            error: x,
          })),
        )
        .reduce((a, b) => a.concat(b), []);

      const missingHeaders: ResponseValidationError[] = Object.keys(
        headerDefinitions,
      )
        .filter(key => !headers[key])
        .map(key => ({
          type: 'MISSING_HEADER',
          name: key,
        }));

      const bodyErrors: ResponseValidationError[] = (response.schema
        ? this.validateValue(preCast(body, response.schema), response.schema)
            .errors
        : []
      ).map(error => ({
        type: 'INVALID_BODY',
        error,
      }));
      const errors = [
        this.ignoreInvalidHeaders ? [] : headerErrors,
        this.ignoreMissingHeaders ? [] : missingHeaders,
        this.ignoreInvalidBody ? [] : bodyErrors,
      ].reduce((a, b) => a.concat(b), []);
      return {
        errors,
        isValid: !errors.length,
      };
    } else if (!this.ignoreInvalidStatus) {
      return {
        errors: [
          {
            type: 'INVALID_STATUS',
            value: res.statusCode,
          },
        ],
        isValid: false,
      };
    } else {
      return { errors: [], isValid: true };
    }
  }

  get ignoreResponseErrors(): boolean {
    return (
      this.ignoreInvalidBody &&
      this.ignoreInvalidHeaders &&
      this.ignoreInvalidStatus &&
      this.ignoreMissingHeaders
    );
  }

  private validateValue(
    value: any,
    parameterSchema: OpenAPI.JsonSchema,
  ): JsonValidatorResult {
    return this.jsonValidator.validate(
      typeof value === 'undefined' ? null : value,
      parameterSchema,
    );
  }

  private getResponse(statusCode: number): OpenAPI.Response {
    const response =
      this.operation.responses[`${statusCode}`] ||
      this.operation.responses.default;

    return response && isReference(response)
      ? resolveJsonPointer(response.$ref, this.spec)
      : response;
  }

  private readonly operation: OpenAPI.Operation;
  private readonly parameters: OpenAPI.Parameter[];
  private readonly jsonValidator: JsonValidator;
  private readonly pipeline: IPipeline;

  private readonly ignoreInvalidHeaders: boolean;
  private readonly ignoreMissingHeaders: boolean;
  private readonly ignoreInvalidBody: boolean;
  private readonly ignoreInvalidStatus: boolean;
}

// TODO: consider using a library for this
function resolveJsonPointer(jpath, object) {
  return jpath
    .split('/')
    .reduce(
      (obj, segment) => (segment === '#' ? object : (obj || {})[segment]),
      object,
    );
}

// TODO: consider reusing body-parser logic
function parseBodyData(mimeType, encoding, data) {
  const decoded =
    data instanceof Buffer && encoding ? data.toString(encoding) : data;
  return mimeType === 'application/json' ? JSON.parse(decoded) : decoded;
}

function parseContentType(contentType) {
  if (!contentType) {
    return {};
  }
  const list = contentType.split('; ');
  const mimeType = list.shift();
  return list.reduce(
    (obj, item) => {
      const x = item.split('=');
      obj[x[0]] = x[1];
      return obj;
    },
    { mimeType },
  );
}

function getOperation(
  operationId: string,
  spec: OpenAPI.Schema,
): OpenAPI.Operation {
  return Object.keys(spec.paths)
    .map(path =>
      Object.keys(spec.paths[path]).map(
        verb => spec.paths[path][verb] as OpenAPI.Operation,
      ),
    )
    .reduce((a, b) => a.concat(b), [])
    .find(operation => operation.operationId === operationId);
}

function getParameters(
  operation: OpenAPI.Operation,
  spec: OpenAPI.Schema,
): OpenAPI.Parameter[] {
  if (operation && operation.parameters) {
    return operation.parameters.map((parameter, i) => {
      if (
        isReference(parameter) &&
        parameter.$ref.startsWith('#/parameters/')
      ) {
        return spec.parameters[parameter.$ref.substr('#/parameters/'.length)];
      } else {
        return parameter as OpenAPI.Parameter;
      }
    });
  } else {
    return [];
  }
}

function isReference<T>(
  value: T | OpenAPI.Reference,
): value is OpenAPI.Reference {
  return (<OpenAPI.Reference>value).$ref !== undefined;
}
