import { RequestValidationResult } from '../types';

export type RequestValues = { [name: string]: any };

export interface IPipeline {
  excecute(values: RequestValues): RequestValidationResult;
}

export interface IPipelineStep {
  excecute(state: RequestValidationResult): RequestValidationResult;
}
