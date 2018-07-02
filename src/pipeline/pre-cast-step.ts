import { IPipelineStep } from './types';
import { OpenAPI, RequestValidationResult } from '../types';

export class PreCastStep implements IPipelineStep {
  constructor(private parameters: OpenAPI.Parameter[]) {}
  excecute(state: RequestValidationResult): RequestValidationResult {
    if (!this.parameters || !this.parameters.length) return state;

    const preCastParams = this.parameters.reduce(
      (params, parameter) => ({
        ...params,
        [parameter.name]: preCast(state.params[parameter.name], parameter),
      }),
      state.params,
    );

    return { ...state, params: preCastParams };
  }
}

/** Casts raw values from the request before they are validated */
export function preCast(
  value: any,
  definition: OpenAPI.Parameter | OpenAPI.Items,
): any {
  if (isParameter(definition) && definition.in === 'body') return value;

  let typePrimitive: OpenAPI.TypePrimitive;
  if (Array.isArray(definition.type)) {
    typePrimitive = definition.type[0];
    console.warn(
      `Found type array. Defaulting to first type '${typePrimitive}'. See https://github.com/skonves/openapi-router/issues/9`,
    );
  } else {
    typePrimitive = definition.type;
  }
  switch (typePrimitive) {
    case 'array': {
      let values;

      switch (definition.collectionFormat) {
        case 'ssv':
          values = value.split(' ');
          break;
        case 'tsv':
          values = value.split('\t');
          break;
        case 'pipes':
          values = value.split('|');
          break;
        case 'csv':
        default:
          if (Array.isArray(value)) {
            values = value;
          } else if (value.split) {
            values = value.split(',');
          } else {
            values = value;
          }

          break;
      }

      return values.map
        ? values.map(v => {
            return preCast(v, definition.items);
          })
        : values;
    }
    case 'boolean': {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value.toLowerCase() === 'false'
          ? value.toLowerCase() === 'true'
          : value;
      } else {
        return value;
      }
    }
    case 'integer': {
      const result = Number(value);
      return Number.isInteger(result) ? result : value;
    }
    case 'number': {
      const result = Number(value);
      return Number.isNaN(result) ? value : result;
    }
    case 'object': {
      try {
        return JSON.parse(value);
      } catch (ex) {
        return value;
      }
    }
    default: {
      return value;
    }
  }
}

function isParameter(
  value: OpenAPI.Parameter | OpenAPI.Items,
): value is OpenAPI.Parameter {
  return (<OpenAPI.Parameter>value).name !== undefined;
}
