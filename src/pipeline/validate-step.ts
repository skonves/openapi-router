import {
  Validator as JsonValidator,
  ValidatorResult as JsonValidatorResult,
} from 'jsonschema';
import { IPipelineStep } from './types';
import { OpenAPI, RequestValidationResult } from '../types';

export class ValidateStep implements IPipelineStep {
  constructor(
    private readonly parameters: OpenAPI.Parameter[],
    spec: OpenAPI.Schema,
  ) {
    this.jsonValidator = new JsonValidator();
    this.jsonValidator.addSchema(spec, '/');
  }
  private readonly jsonValidator: JsonValidator;
  excecute(state: RequestValidationResult): RequestValidationResult {
    if (!this.parameters || !this.parameters.length) return state;

    return this.parameters.reduce((acc, parameter) => {
      const value = acc.params[parameter.name];

      if (typeof value !== 'undefined') {
        const validatorResult = this.validateValue(
          value,
          parameter.in === 'body' ? parameter.schema : parameter,
        );

        if (validatorResult.errors.length > 0) {
          return {
            ...acc,
            isValid: false,
            errors: [
              ...acc.errors,
              {
                parameter: parameter.name,
                notFound: false,
                notImplemented: false,
                notAllowed: false,
                errors: validatorResult.errors,
              },
            ],
          };
        }
      } else if (parameter.required) {
        return {
          ...acc,
          isValid: false,
          errors: [
            ...acc.errors,
            {
              parameter: parameter.name,
              location: parameter.in,
              notFound: true,
              notImplemented: false,
              notAllowed: false,
            },
          ],
        };
      }

      return acc;
    }, state);
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
}
