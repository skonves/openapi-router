import * as express from 'express';
import { OpenAPI } from './types';

function getValueFromPath(req: express.Request, paramName: string) {
  const key = Object.keys(req.params).filter(
    param => param.toLowerCase() === paramName.toLowerCase(),
  )[0];
  return key ? req.params[key] : undefined;
}

function getValueFromQuery(req: express.Request, paramName: string) {
  const key = Object.keys(req.query).filter(
    param => param.toLowerCase() === paramName.toLowerCase(),
  )[0];
  return key ? req.query[key] : undefined;
}

function getValueFromHeaders(req: express.Request, paramName: string) {
  return req.get(paramName);
}

function getValueFromBody(req: express.Request, paramName: string) {
  return req.body || {};
}

export function getValuesFromRequest(
  req: express.Request,
  parameters: OpenAPI.Parameter[],
) {
  const values: { [name: string]: any } = {};

  parameters.forEach(parameter => {
    switch (parameter.in) {
      case 'path':
        values[parameter.name] = getValueFromPath(req, parameter.name);
        break;
      case 'query':
        values[parameter.name] = getValueFromQuery(req, parameter.name);
        break;
      case 'header':
        values[parameter.name] = getValueFromHeaders(req, parameter.name);
        break;
      case 'body':
        values[parameter.name] = getValueFromBody(req, parameter.name);
        break;
      // case 'form':
      // 	values[parameter.name] = getValueFromForm(request, parameter.name);
    }
  });

  return values;
}
