import { expect } from 'chai';
import { RequestValidationResult, OpenAPI } from '../types';
import { PostCastStep } from './post-cast-step';

describe('PostCastStep', () => {
  it('casts a "date-time" string value to a Date object', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testDate',
        type: 'string',
        format: 'date-time',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testDate: '2001-10-20',
      },
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.params.testDate).to.be.an.instanceOf(Date);
  });

  it('casts a "date" string value to a Date object', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testDate',
        type: 'string',
        format: 'date',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testDate: '2001-10-20',
      },
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.params.testDate).to.be.an.instanceOf(Date);
  });

  it('does not cast a non-date format to a Date object', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testDate',
        type: 'string',
        format: 'email',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testDate: '2001-10-20',
      },
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.params.testDate).to.not.be.an.instanceOf(Date);
  });

  it('does not cast a string value without a format', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testDate',
        type: 'string',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testDate: '2001-10-20',
      },
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.params.testDate).to.not.be.an.instanceOf(Date);
  });

  it('does not cast any values there are no parameters defined', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [];
    const state: RequestValidationResult = {
      errors: [],
      isValid: false,
      params: {},
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result).to.deep.equal(state);
  });

  it('does not cast any values if the state is not valid', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testDate',
        type: 'string',
        format: 'date-time',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: false,
      params: {
        testDate: '2001-10-20',
      },
    };

    const sut = new PostCastStep(parameters);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.params.testDate).to.not.be.an.instanceOf(Date);
  });
});
