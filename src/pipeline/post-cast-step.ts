import { IPipelineStep } from './types';
import { OpenAPI, RequestValidationResult } from '../types';

export class PostCastStep implements IPipelineStep {
  constructor(private parameters: OpenAPI.Parameter[]) {}
  excecute(state: RequestValidationResult): RequestValidationResult {
    if (!this.parameters || !this.parameters.length || !state.isValid) {
      return state;
    }

    const preCastParams = this.parameters.reduce(
      (params, parameter) => ({
        ...params,
        [parameter.name]: postCast(state.params[parameter.name], parameter),
      }),
      state.params,
    );

    return { ...state, params: preCastParams };
  }
}

/** Casts values AFTER validated to support string formats */
function postCast(
  value: any,
  definition: OpenAPI.Parameter | OpenAPI.JsonSchema,
) {
  const type = definition.type;
  const format = definition.format;
  if (type === 'string' && (format === 'date' || format === 'date-time')) {
    return new Date(value);
  } else {
    return value;
  }
}
