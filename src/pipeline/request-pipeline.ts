import { IPipeline, IPipelineStep, RequestValues } from './types';
import { RequestValidationResult } from '../types';

export class RequestPipeline implements IPipeline {
  constructor(...steps: IPipelineStep[]) {
    this.steps = steps;
  }
  private readonly steps: IPipelineStep[];
  excecute(params: RequestValues): RequestValidationResult {
    const initialState: RequestValidationResult = {
      errors: [],
      isValid: true,
      params,
    };

    return this.steps.reduce(
      (state, step) => step.excecute(state),
      initialState,
    );
  }
}
