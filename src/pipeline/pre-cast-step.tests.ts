import { expect } from 'chai';
import { RequestValidationResult, OpenAPI } from '../types';
import { PreCastStep, sortTypePrimatives } from './pre-cast-step';

describe('PreCastStep', () => {
  it('does not cast a body parameter', () => {
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

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.body)
      .to.be.an('object')
      .to.deep.equal({ key: 'some value' });
  });

  it('casts a string to a boolean', () => {
    // ARRANGE
    const value = false;
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'boolean',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: `${value}`,
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('boolean')
      .to.equal(false);
  });

  it('does not cast an invalid string to a boolean', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'boolean',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: 'not a boolean',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('string')
      .to.equal('not a boolean');
  });

  it('does not cast a null to a boolean', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'boolean',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: null,
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('null')
      .to.equal(null);
  });

  it('casts a string to an integer', () => {
    // ARRANGE
    const value = 44;
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'integer',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: `${value}`,
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('number')
      .to.equal(value);
  });

  it('does not cast an invalid string to an integer', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'integer',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '44.4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('string')
      .to.equal('44.4');
  });

  it('casts a string to a number', () => {
    // ARRANGE
    const value = 44.4;
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'number',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: `${value}`,
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('number')
      .to.equal(value);
  });

  it('does not cast an invalid string to a number', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'number',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: 'not a number',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('string')
      .to.equal('not a number');
  });

  it('casts a string to an object', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'object',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '{"key": "value"}',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.an('object')
      .to.deep.equal({ key: 'value' });
  });

  it('does not cast an invalid string to an object', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'object',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '{not: an object}',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue)
      .to.be.a('string')
      .to.deep.equal('{not: an object}');
  });

  it('casts a comma-separated string to an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
        collectionFormat: 'csv',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '1, 2, 3, 4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('casts a space-separated string to an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
        collectionFormat: 'ssv',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '1 2 3 4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('casts a tab-separated string to an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
        collectionFormat: 'tsv',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '1\t2\t3\t4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('casts a pipe-separated string to an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
        collectionFormat: 'pipes',
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '1|2|3|4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('casts string to an array with csv as the default', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: '1,2,3,4',
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('does not cast a value that is already an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: [1, 2, 3, 4],
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal([1, 2, 3, 4]);
  });

  it('does not cast an invalid value to an array', () => {
    // ARRANGE
    const parameters: OpenAPI.Parameter[] = [
      {
        in: 'query',
        name: 'testValue',
        type: 'array',
        items: {
          type: 'integer',
        },
      },
    ];
    const state: RequestValidationResult = {
      errors: [],
      isValid: true,
      params: {
        testValue: { not: 'an array or a string' },
      },
    };

    const sut = new PreCastStep(parameters);

    // ACT
    const result = sut.excecute(state);

    // ASSERT
    expect(result.params.testValue).to.deep.equal({
      not: 'an array or a string',
    });
  });

  describe('type arrays', () => {
    it('sorts correctly', () => {
      // ARRANGE
      const types: OpenAPI.TypePrimitive[] = [
        'string',
        'array',
        'boolean',
        'number',
      ];

      // ACT
      const result = sortTypePrimatives(types);

      // ASSERT
      expect(result).to.deep.equal(['boolean', 'number', 'array', 'string']);
    });

    run(['boolean', 'number'], '5', 5, 'number');
    run(['boolean', 'number'], 'true', true, 'boolean');
    run(['boolean', 'number'], 'asdf', 'asdf', 'string');
    run(['boolean', 'file'], 'asdf', 'asdf', 'string');

    it(`returns "1,2,3" as an array for the type array ["array", "number"]`, () => {
      // ARRANGE
      const parameters: OpenAPI.Parameter[] = [
        {
          in: 'query',
          name: 'testValue',
          type: ['array', 'number'],
          items: {
            type: 'number',
          },
        },
      ];
      const state: RequestValidationResult = {
        errors: [],
        isValid: true,
        params: {
          testValue: '1,2,3',
        },
      };

      const sut = new PreCastStep(parameters);

      // ACT
      const result = sut.excecute(state);

      // ASSERT
      expect(result.params.testValue)
        .to.be.an('array')
        .to.deep.equal([1, 2, 3]);
    });

    function run<T>(
      types: OpenAPI.TypePrimitive[],
      value: string,
      expectedValue: T,
      expectedType: string,
    ) {
      const testCase = `returns "${value}" as a ${expectedType} for the type array [${types.map(
        t => `"${t}"`,
      )}]`;
      it(testCase, () => {
        // ARRANGE
        const parameters: OpenAPI.Parameter[] = [
          {
            in: 'query',
            name: 'testValue',
            type: types,
          },
        ];
        const state: RequestValidationResult = {
          errors: [],
          isValid: true,
          params: {
            testValue: `${value}`,
          },
        };

        const sut = new PreCastStep(parameters);

        // ACT
        const result = sut.excecute(state);

        // ASSERT
        expect(result.params.testValue)
          .to.be.a(expectedType)
          .to.equal(expectedValue);
      });
    }
  });
});
