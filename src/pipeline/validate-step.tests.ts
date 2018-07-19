import { expect } from 'chai';
import { RequestValidationResult, OpenAPI } from '../types';
import { ValidateStep } from './validate-step';

describe('ValidateStep', () => {
  it('handles a valid body', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'body',
        name: 'body',
        schema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      },
    ];

    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        body: { key: 'some value' },
      },
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.be.empty;
    expect(result.isValid).to.be.true;
    expect(result.params.body).to.deep.equal({ key: 'some value' });
  });

  it('handles an invalid body', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'body',
        name: 'body',
        schema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        body: { notKey: 'some value' },
      },
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.not.be.empty;
    expect(result.isValid).to.be.false;
    expect(result.params.body).to.deep.equal({ notKey: 'some value' });
  });

  it('handles a missing optional body', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'body',
        name: 'body',
        required: false,
        schema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {},
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.be.empty;
    expect(result.isValid).to.be.true;
    expect(result.params.body).to.not.be.ok;
  });

  it('handles a missing required body', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {},
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.not.be.empty;
    expect(result.isValid).to.be.false;
    expect(result.params.body).to.not.be.ok;
  });

  it('handles a valid non-body parameter', () => {
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
      params: {
        testValue: 'some value',
      },
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.be.empty;
    expect(result.isValid).to.be.true;
    expect(result.params.testValue).to.equal('some value');
  });

  it('short circuits when there are no parameters', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {},
    };

    const sut = new ValidateStep(parameters, baseSpec());

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result).to.deep.equal(state);
  });

  it('handles a valid parameter with ref', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'body',
        name: 'body',
        schema: {
          $ref: '#/definitions/testType',
        },
      },
    ];
    const spec: OpenAPI.Schema = {
      ...baseSpec(),
      paths: {
        '/test': {
          get: {
            parameters,
            responses: {},
          },
        },
      },
      definitions: {
        testType: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      },
    };

    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        body: { key: 'some value' },
      },
    };

    const sut = new ValidateStep(parameters, spec);

    // ACT
    const result = sut.execute(state);

    // ASSERT
    expect(result.errors).to.be.empty;
    expect(result.isValid).to.be.true;
    expect(result.params.body).to.deep.equal({ key: 'some value' });
  });
});

function baseSpec(): OpenAPI.Schema {
  return {
    swagger: '2.0',
    info: {
      version: '0.0.0',
      title: 'test spec',
    },
    paths: {},
  };
}
