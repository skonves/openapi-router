import { expect } from 'chai';
import { RequestValidationResult, OpenAPI } from '../types';
import { DefinedValuesStep } from './defined-values-step';

describe('DefinedValuesStep', () => {
  it('includes a param if there is a parameter with the same name', () => {
    // ARRANGE
    const value = 'the value';
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
      params: {
        testValue: value,
      },
    };

    const sut = new DefinedValuesStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params).to.haveOwnProperty('testValue');
    expect(result.params.testValue).to.equal(value);
  });

  it('does not include a param if there is not a parameter with the same name', () => {
    // ARRANGE
    const value = 'the value';
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
      params: {
        someOtherValue: value,
      },
    };

    const sut = new DefinedValuesStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params).to.not.haveOwnProperty('someOtherValue');
  });
});
