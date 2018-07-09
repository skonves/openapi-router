import * as express from 'express';
import * as uuid from 'uuid';
import {
  RequestValidationResult,
  ResponseValidationResult,
  ErrorScope,
  JsonApiError,
  ErrorCode,
  OPENAPI_ERRORS,
} from './types';

export function errorHandler(
  err: { code?: string; scope?: ErrorScope; allowedMethods?: string[] },
  req: express.Request & { openapi?: RequestValidationResult },
  res: express.Response & { openapi?: ResponseValidationResult },
  next: express.NextFunction,
) {
  if (err.code === OPENAPI_ERRORS && !res.headersSent) {
    switch (err.scope) {
      case ErrorScope.request: {
        const errors: JsonApiError[] = [];
        let code = 200;

        for (const error of req.openapi.errors) {
          if (error.notAllowed) {
            // Method Not Allowed
            errors.push({
              id: uuid.v4(),
              status: '405',
              code: ErrorCode.MethodNotAllowed,
              title: 'Method not allowed',
            });
            code = Math.max(405, code);
            if (err.allowedMethods) {
              res.set(
                'Allow',
                err.allowedMethods.map(m => m.toUpperCase()).join(', '),
              );
            } else {
              res.set('Allow');
            }
          } else if (error.notImplemented) {
            // Method Not Allowed
            errors.push({
              id: uuid.v4(),
              status: '501',
              code: ErrorCode.NotImplemented,
              title: 'Not implemented',
            });
            code = Math.max(501, code);
          } else if (!error.parameter && error.notFound) {
            // Route Not Found
            const e = {
              id: uuid.v4(),
              code: ErrorCode.NotFound,
              status: '404',
              title: 'Route not found',
              detail: `Route '${req.method} ${
                req.path
              }' could not be found.  Refer to docs for a complete list of routes.`,
            };

            errors.push(e);
            code = Math.max(404, code);
          } else if (error.parameter && error.notFound) {
            // Parameter Not Found
            errors.push({
              id: uuid.v4(),
              code: ErrorCode.MissingParameter,
              status: '400',
              title: 'Missing required parameter',
              detail: `Required parameter '${
                error.parameter
              }' could not be found in ${error.location}.`,
              source: {
                parameter: error.parameter,
              },
            });
            code = Math.max(400, code);
          } else if (error.parameter && Array.isArray(error.errors)) {
            // Bad Parameter
            error.errors.forEach(validationError => {
              const instanceName = validationError.property.replace(
                'instance',
                error.parameter,
              );
              const instanceType =
                instanceName === error.parameter ? 'Parameter' : 'Property';
              const instanceValueDisplay =
                typeof validationError.instance === 'undefined'
                  ? ' '
                  : ` (${validationError.instance}) `;

              errors.push({
                id: uuid.v4(),
                code: ErrorCode.BadRequest,
                status: '400',
                title: 'Request value is invalid',
                detail: `${instanceType} '${instanceName}'${instanceValueDisplay}${
                  validationError.message
                }.`,
                source: {
                  // TODO: return valid JSON Path for body parameters
                  // SEE: http://jsonapi.org/format/#errors
                  parameter: error.parameter,
                },
              });
            });
            code = Math.max(400, code);
          }
        }

        res.status(code).json({ errors });

        break;
      }
      case ErrorScope.response: {
        const errors: JsonApiError[] = res.openapi.errors
          .map(error => {
            switch (error.type) {
              case 'INVALID_HEADER':
                return {
                  id: uuid.v4(),
                  code: ErrorCode.InvalidResponseHeader,
                  status: '500',
                  title: 'Response header is invalid. (INTERNAL SERVER ERROR)',
                  detail: `Response header '${error.name}' ('${res.get(
                    error.name,
                  )}') ${error.error.message}`,
                  source: {
                    parameter: error.name,
                  },
                };
              case 'MISSING_HEADER':
                return {
                  id: uuid.v4(),
                  code: ErrorCode.MissingResponseHeader,
                  status: '500',
                  title:
                    'Required response header is missing. (INTERNAL SERVER ERROR)',
                  detail: `Required response header '${
                    error.name
                  }' was missing from the original response.`,
                  source: {
                    parameter: error.name,
                  },
                };
              case 'INVALID_BODY':
                return {
                  id: uuid.v4(),
                  code: ErrorCode.InvalidRepsonseBody,
                  status: '500',
                  title: 'Response body is invalid. (INTERNAL SERVER ERROR)',
                  detail: `${error.error.property} ${error.error.message}`,
                  source: {},
                };
              case 'INVALID_STATUS':
                return {
                  id: uuid.v4(),
                  code: ErrorCode.InvalidResponseCode,
                  status: '500',
                  title:
                    'Undefined response for status code. (INTERNAL SERVER ERROR)',
                  detail: `No response is defined for status code '${
                    error.value
                  }' and no default response is defined.`,
                  source: {},
                };
              default:
                return null;
            }
          })
          .filter(x => x);
        res.status(500).json({ errors });
      }
    }
  }
  next(err);
}
