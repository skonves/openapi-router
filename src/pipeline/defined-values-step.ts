import { IPipelineStep } from './types';
import { OpenAPI, RequestValidationResult } from '../types';

/** Restricts `param` values to parameters defined in the spec */
export class DefinedValuesStep implements IPipelineStep {
  constructor(private parameters: OpenAPI.Parameter[]) {}
  execute(state: RequestValidationResult): RequestValidationResult {
    const definedParams = this.parameters.reduce(
      (values, parameter) => ({
        ...values,
        [parameter.name]: state.params[parameter.name],
      }),
      {},
    );

    return { ...state, params: definedParams };
  }
}
