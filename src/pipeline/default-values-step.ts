import { IPipelineStep } from './types';
import { OpenAPI, RequestValidationResult } from '../types';

export class DefaultValuesStep implements IPipelineStep {
  constructor(private parameters: OpenAPI.Parameter[]) {}
  excecute(state: RequestValidationResult): RequestValidationResult {
    if (!this.parameters || !this.parameters.length) return state;

    const paramsWithDefaults = this.parameters.reduce(
      (acc, parameter) => ({
        ...acc,
        [parameter.name]: getValueOrDefault(
          state.params[parameter.name],
          parameter,
        ),
      }),
      state.params,
    );

    return { ...state, params: paramsWithDefaults };
  }
}

function getValueOrDefault<T>(value: T, parameter: OpenAPI.Parameter): T {
  return typeof value === 'undefined' &&
    !parameter.required &&
    parameter.in !== 'body'
    ? parameter.default
    : value;
}
