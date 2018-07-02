import { expect } from 'chai';
import { RequestValidationResult, OpenAPI } from '../types';
import { DefaultValuesStep } from './default-values-step';

describe('DefaultValuesStep', () => {
  it('uses the default value if a value is not provided', () => {
    // ARRANGE
    const defaultValue = 'the default value';
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'string',
        default: defaultValue,
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {},
    };

    const sut = new DefaultValuesStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.be.equal(defaultValue);
  });

  it('does not use the default value if a value is provided', () => {
    // ARRANGE
    const defaultValue = 'the default value';
    const providedValue = 'the provided value';
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'string',
        default: defaultValue,
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: providedValue,
      },
    };

    const sut = new DefaultValuesStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.be.equal(providedValue);
  });

  it('leaves values undefined if the paremeter does not define a default value', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'string',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {},
    };

    const sut = new DefaultValuesStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.be.undefined;
  });
});
