import * as express from 'express';
import {
  OpenAPI,
  RequestValidationResult,
  ResponseValidationResult,
  OPENAPI_ERRORS,
  ErrorScope,
  ResponseOptions,
  RouteHandler,
} from './types';
import { Validator } from './validator';

export class Router {
  constructor(
    private spec: OpenAPI.Schema,
    private app: express.Express,
    private options?: ResponseOptions,
  ) {
    this.operations = Object.keys(spec.paths)
      .map(path => {
        const pathItem = spec.paths[path];

        return Object.keys(pathItem).map(verb => {
          const operation: OpenAPI.Operation = pathItem[verb];

          return {
            id: operation.operationId,
            verb,
            path: getExpressPath(path),
            operation,
          };
        });
      })
      .reduce((a, b) => a.concat(b), [])
      .filter(op => op.id);
  }

  /** Adds a route handler for the specified OpenAPI operation */
  use(operationId: string, handler: RouteHandler) {
    const validator = new Validator(operationId, this.spec, this.options);
    const operation = this.operations.find(op => op.id === operationId);
    if (!operation) {
      throw new Error(`Operation with ID '${operationId}' is not defined.`);
    }

    if (this.app[operation.verb]) {
      this.app[operation.verb](
        operation.path,
        (
          req: express.Request & { openapi: RequestValidationResult },
          res: express.Response & { openapi: ResponseValidationResult },
          next: express.NextFunction,
        ) => {
          req.openapi = validator.validateRequest(req);

          if (req.openapi.isValid) {
            if (!validator.ignoreResponseErrors) {
              const fn = res.end;
              res.end = function() {
                if (res.openapi || res.statusCode === 304) {
                  fn.apply(res, arguments);
                } else if (!res.openapi) {
                  res.openapi = validator.validateResponse(res, arguments);

                  if (res.openapi.isValid) {
                    fn.apply(res, arguments);
                  } else {
                    next({
                      code: OPENAPI_ERRORS,
                      scope: ErrorScope.response,
                    });
                  }
                }
              };
            }

            return handler(req, res, next);
          } else {
            return next({
              code: OPENAPI_ERRORS,
              scope: ErrorScope.request,
            });
          }
        },
      );
      this.handledPaths.add(operation.path);
    } else {
      console.warn(
        `WARNING! Express cannot handle method ${operation.verb.toUpperCase()}`,
      );
    }
  }

  /** Adds handlers for un-implemented operations, unsupported HTTP methods, as well as a final 404 catch-all */
  addCatchAllRoutes() {
    this.operations
      .filter(op => !this.handledPaths.has(op.path))
      .forEach(op => {
        console.warn(
          `WARNING! operation ${op.id} (${op.verb.toUpperCase()} ${
            op.path
          }) is unhandled`,
        );
        this.app[op.verb](
          op.path,
          (
            req: express.Request & { openapi?: RequestValidationResult },
            res: express.Response,
            next: express.NextFunction,
          ) => {
            req.openapi = req.openapi || {
              errors: [],
              isValid: false,
              params: {},
            };

            req.openapi.errors.push({
              notFound: false,
              notImplemented: true,
              notAllowed: false,
            });

            next({ code: OPENAPI_ERRORS, scope: ErrorScope.request });
          },
        );
      });

    const paths = new Set<string>(this.operations.map(op => op.path));

    paths.forEach(path => {
      const allowedMethods = this.operations
        .filter(op => op.path === path)
        .map(op => op.verb);

      this.app.all(
        path,
        (
          req: express.Request & { openapi?: RequestValidationResult },
          res: express.Response,
          next: express.NextFunction,
        ) => {
          req.openapi = req.openapi || {
            errors: [],
            isValid: false,
            params: {},
          };

          req.openapi.errors.push({
            notFound: false,
            notImplemented: false,
            notAllowed: true,
          });

          next({
            code: OPENAPI_ERRORS,
            scope: ErrorScope.request,
            allowedMethods,
          });
        },
      );
    });

    this.app.all(
      '*',
      (
        req: express.Request & { openapi?: RequestValidationResult },
        res: express.Response,
        next: express.NextFunction,
      ) => {
        req.openapi = req.openapi || {
          errors: [],
          isValid: false,
          params: {},
        };

        req.openapi.errors.push({
          notFound: true,
          notImplemented: false,
          notAllowed: false,
        });

        next({ code: OPENAPI_ERRORS, scope: ErrorScope.request });
      },
    );
  }

  private readonly handledPaths = new Set<string>();

  private readonly operations: {
    id: string;
    verb: string;
    path: string;
    operation: OpenAPI.Operation;
  }[];
}

function getExpressPath(swaggerPath: string, basePath?: string) {
  let expressPath = swaggerPath;
  while (expressPath.indexOf('{') > -1) {
    expressPath = expressPath.replace('{', ':').replace('}', '');
  }

  if (!expressPath.startsWith(basePath || '')) {
    throw new Error('Operation path is not located within base path');
  }

  return expressPath.substring((basePath || '').length);
}
