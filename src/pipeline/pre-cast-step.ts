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

  if (Array.isArray(definition.type)) {
    for (const typePrimitive of sortTypePrimatives(definition.type)) {
      const result = doPreCast(value, typePrimitive, definition);
      if (result.success) return result.value;
    }
    return value;
  } else {
    return doPreCast(value, definition.type, definition).value;
  }
}

export function doPreCast(
  value: any,
  typePrimitive: OpenAPI.TypePrimitive,
  definition: OpenAPI.Parameter | OpenAPI.Items,
): { value: any; success: boolean } {
  if (isParameter(definition) && definition.in === 'body')
    return { value, success: true };

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
        ? {
            value: values.map(v => {
              return preCast(v, definition.items);
            }),
            success: true,
          }
        : { value, success: false };
    }
    case 'boolean': {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value.toLowerCase() === 'false'
          ? { value: value.toLowerCase() === 'true', success: true }
          : { value, success: false };
      } else {
        return { value, success: false };
      }
    }
    case 'integer': {
      const result = Number(value);
      return Number.isInteger(result)
        ? { value: result, success: true }
        : { value, success: false };
    }
    case 'number': {
      const result = Number(value);
      return Number.isNaN(result)
        ? { value, success: false }
        : { value: result, success: true };
    }
    case 'object': {
      try {
        return { value: JSON.parse(value), success: true };
      } catch (ex) {
        return { value, success: false };
      }
    }
    default: {
      return { value, success: false };
    }
  }
}

export function sortTypePrimatives(types: OpenAPI.TypePrimitive[]) {
  const order: { [key: string]: number } = {
    boolean: 1,
    integer: 2,
    number: 3,
    array: 4,
    object: 4,
    string: 99,
  };

  return [...types].sort(
    (a, b) =>
      (order[a] || Number.MAX_SAFE_INTEGER) -
      (order[b] || Number.MAX_SAFE_INTEGER),
  );
}

function isParameter(
  value: OpenAPI.Parameter | OpenAPI.Items,
): value is OpenAPI.Parameter {
  return (<OpenAPI.Parameter>value).name !== undefined;
}
