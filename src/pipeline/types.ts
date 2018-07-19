import { RequestValidationResult } from '../types';

export type RequestValues = { [name: string]: any };

export interface IPipeline {
  execute(values: RequestValues): RequestValidationResult;
}

export interface IPipelineStep {
  execute(state: RequestValidationResult): RequestValidationResult;
}
