import * as express from 'express';
import { ValidationError as JsonValidationError } from 'jsonschema';

export const OPENAPI_ERRORS = 'OPENAPI_ERRORS';

export type ResponseValidationError = {
  type: string;
  name?: string;
  value?: any;
  error?: JsonValidationError;
};

export type ResponseValidationResult = {
  errors: ResponseValidationError[];
  isValid: boolean;
};

export type RequestValidationResult = {
  params: any;
  errors: RequestValidationError[];
  isValid: boolean;
};

export type RequestValidationError = {
  parameter?: string;
  location?: string;
  notFound: boolean;
  notImplemented: boolean;
  notAllowed: boolean;
  errors?: JsonValidationError[];
};

export type ResponseOptions = {
  ignoreInvalidHeaders?: boolean;
  ignoreMissingHeaders?: boolean;
  ignoreInvalidBody?: boolean;
  ignoreInvalidStatus?: boolean;
};

export type JsonApiError = {
  id: string;
  status?: string;
  code?: ErrorCode;
  title?: string;
  detail?: string;
  source?: {
    parameter?: string;
    pointer?: string;
  };
  meta?: any;
};

export enum ErrorScope {
  request = 'request',
  response = 'response',
}

export enum ErrorCode {
  NotImplemented = 'NOT_IMPLEMENTED',
  MethodNotAllowed = 'METHOD_NOT_ALLOWED',
  NotFound = 'NOT_FOUND',
  BadRequest = 'BAD_REQUEST',
  MissingParameter = 'MISSING_PARAMETER',
  InvalidResponseHeader = 'INVLAID_RESPONSE_HEADER',
  MissingResponseHeader = 'MISSING_RESPONSE_HEADER',
  InvalidRepsonseBody = 'INVALID_RESPONSE_BODY',
  InvalidResponseCode = 'INVALID_RESPONSE_CODE',
}

export type RouteHandler = (
  req: express.Request & { openapi: RequestValidationResult },
  res: express.Response & { openapi: ResponseValidationResult },
  next?: express.NextFunction,
) => void | Promise<void>;

export namespace OpenAPI {
  export type Schema = {
    swagger: '2.0';
    info: Info;
    host?: string;
    basePath?: string;
    schemes?: ['http' | 'https' | 'ws' | 'wss'];
    consumes?: string[];
    produces?: string[];
    paths: Paths;
    definitions?: Definitions;
    parameters?: ParameterDefinitions;
    responses?: ResponseDefinitions;
    securityDefinitions?: SecurityDefinitions;
    security?: SecurityRequirement[];
    tags?: Tag[];
    externalDocs?: ExternalDocumentation;
  };

  export type Info = {
    version: string;
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: Contact;
    license?: License;
  };

  export type Paths = {
    [path: string]: PathItem;
  };

  export type PathItem = {
    $ref?: string;
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    parameters?: (Parameter | Reference)[];
  };

  export type Parameter =
    | {
        name: string;
        in: 'query' | 'header' | 'path' | 'formData';
        description?: string;
        required?: boolean;
        type:
          | 'string'
          | 'number'
          | 'integer'
          | 'boolean'
          | 'array'
          | 'file'
          | 'object'; // TODO: verify that object is valid
        format?: string;
        allowEmptyValue?: boolean;
        items?: Items;
        collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
        default?: any;
        maximum?: number;
        exclusiveMaximum?: boolean;
        // TODO: finish this
      }
    | {
        name: string;
        in: 'body';
        description?: string;
        required?: boolean;
        schema: JsonSchema;
      };

  export type Headers = {
    [name: string]: Header;
  };

  export type Header = {
    description?: string;
    type:
      | 'string'
      | 'number'
      | 'integer'
      | 'boolean'
      | 'array'
      | 'file'
      | 'object'; // TODO: verify that object is valid
    format?: string;
    items?: Items;
    collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
    default?: any;
    maximum?: number;
    exclusiveMaximum?: boolean;
    // TODO: finish this
  };

  export type Reference = {
    $ref: string;
  };

  export type Items = {
    type:
      | 'string'
      | 'number'
      | 'integer'
      | 'boolean'
      | 'array'
      | 'file'
      | 'object'; // TODO: verify that object is valid
    format?: string;
    items?: Items;
    collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
    default?: any;
    maximum?: number;
    exclusiveMaximum?: boolean;
    // TODO: finish this
  };

  export type Definitions = {
    [name: string]: any;
  };

  export type ParameterDefinitions = {
    [name: string]: Parameter;
  };

  export type Responses = {
    [httpStatusCode: string]: Response | Reference;
  };

  export type ResponseDefinitions = {
    [name: string]: Response;
  };

  export type Response = {
    description: string;
    schema?: JsonSchema;
    headers?: Headers;
    examples?: Examples;
  };

  export type Examples = {
    [mimeType: string]: any;
  };

  export type SecurityDefinitions = {
    [name: string]: SecurityScheme;
  };

  export type SecurityScheme =
    | {
        type: 'basic';
        description?: string;
      }
    | {
        type: 'apiKey';
        description?: string;
        name: string;
        in: 'header' | 'query';
      }
    | {
        type: 'oauth2';
        description?: string;
        name: string;
        authorizationUrl: string;
        tokenUrl: string;
        scopes: Scopes;
      };

  export type Scopes = {
    [name: string]: string;
  };

  export type SecurityRequirement = {
    [name: string]: string[];
  };

  export type Tag = {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
  };

  export type ExternalDocumentation = {
    description?: string;
    url: string;
  };

  export type Contact = {
    name?: string;
    url?: string;
    email?: string;
  };

  export type License = {
    name: string;
    url?: string;
  };

  export type Operation = {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
    operationId?: string;
    consumes?: string[];
    produces?: string[];
    parameters?: (Parameter | Reference)[];
    responses: Responses;
    schemes?: ['http' | 'https' | 'ws' | 'wss'];
    deprecated?: boolean;
    security?: SecurityRequirement[];
  };

  export type JsonSchema = any;
}
