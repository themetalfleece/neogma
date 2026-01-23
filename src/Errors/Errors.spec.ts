import {
  NeogmaConnectivityError,
  NeogmaConstraintError,
  NeogmaError,
  NeogmaInstanceValidationError,
  NeogmaNotFoundError,
} from './index';

describe('Neogma Errors', () => {
  describe('NeogmaError', () => {
    it('should be an instance of Error', () => {
      const error = new NeogmaError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NeogmaError);
    });

    it('should have correct message and data', () => {
      const error = new NeogmaError('test message', { key: 'value' });
      expect(error.message).toBe('test message');
      expect(error.data).toEqual({ key: 'value' });
    });

    it('should have correct name', () => {
      const error = new NeogmaError('test');
      expect(error.name).toBe('NeogmaError');
    });

    it('should default data to empty object', () => {
      const error = new NeogmaError('test');
      expect(error.data).toEqual({});
    });
  });

  describe('NeogmaConstraintError', () => {
    it('should be an instance of NeogmaError and Error', () => {
      const error = new NeogmaConstraintError('constraint violated');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NeogmaError);
      expect(error).toBeInstanceOf(NeogmaConstraintError);
    });

    it('should have correct name', () => {
      const error = new NeogmaConstraintError('test');
      expect(error.name).toBe('NeogmaConstraintError');
    });

    it('should store actual and expected data', () => {
      const error = new NeogmaConstraintError('mismatch', {
        actual: { count: 1 },
        expected: { count: 5 },
      });
      expect(error.data.actual).toEqual({ count: 1 });
      expect(error.data.expected).toEqual({ count: 5 });
    });

    it('should be catchable as NeogmaError', () => {
      const throwError = () => {
        throw new NeogmaConstraintError('test');
      };

      try {
        throwError();
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(NeogmaError);
        expect(e).toBeInstanceOf(NeogmaConstraintError);
      }
    });
  });

  describe('NeogmaNotFoundError', () => {
    it('should be an instance of NeogmaError and Error', () => {
      const error = new NeogmaNotFoundError('not found');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NeogmaError);
      expect(error).toBeInstanceOf(NeogmaNotFoundError);
    });

    it('should have correct name', () => {
      const error = new NeogmaNotFoundError('test');
      expect(error.name).toBe('NeogmaNotFoundError');
    });

    it('should store search criteria in data', () => {
      const error = new NeogmaNotFoundError('User not found', {
        searchCriteria: { id: '123' },
      });
      expect(error.data).toEqual({ searchCriteria: { id: '123' } });
    });

    it('should be distinguishable from NeogmaConstraintError', () => {
      const notFoundError = new NeogmaNotFoundError('not found');
      const constraintError = new NeogmaConstraintError('constraint');

      expect(notFoundError).toBeInstanceOf(NeogmaNotFoundError);
      expect(notFoundError).not.toBeInstanceOf(NeogmaConstraintError);

      expect(constraintError).toBeInstanceOf(NeogmaConstraintError);
      expect(constraintError).not.toBeInstanceOf(NeogmaNotFoundError);
    });
  });

  describe('NeogmaConnectivityError', () => {
    it('should be an instance of NeogmaError and Error', () => {
      const error = new NeogmaConnectivityError();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NeogmaError);
      expect(error).toBeInstanceOf(NeogmaConnectivityError);
    });

    it('should have correct name', () => {
      const error = new NeogmaConnectivityError();
      expect(error.name).toBe('NeogmaConnectivityError');
    });

    it('should have default message', () => {
      const error = new NeogmaConnectivityError();
      expect(error.message).toBe('Error while connecting to Neo4j');
    });

    it('should store connection error data', () => {
      const originalError = { code: 'ECONNREFUSED' };
      const error = new NeogmaConnectivityError(originalError);
      expect(error.data).toEqual(originalError);
    });
  });

  describe('NeogmaInstanceValidationError', () => {
    const mockModel = { getModelName: () => 'TestModel' } as any;
    const mockErrors = [{ property: 'name', message: 'is required' }];

    it('should be an instance of NeogmaError and Error', () => {
      const error = new NeogmaInstanceValidationError('validation failed', {
        model: mockModel,
        errors: mockErrors,
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NeogmaError);
      expect(error).toBeInstanceOf(NeogmaInstanceValidationError);
    });

    it('should have correct name', () => {
      const error = new NeogmaInstanceValidationError('test', {
        model: mockModel,
        errors: mockErrors,
      });
      expect(error.name).toBe('NeogmaInstanceValidationError');
    });

    it('should store model and errors', () => {
      const error = new NeogmaInstanceValidationError('validation failed', {
        model: mockModel,
        errors: mockErrors,
      });
      expect(error.data.model).toBe(mockModel);
      expect(error.data.errors).toEqual(mockErrors);
    });
  });

  describe('Error hierarchy and catching', () => {
    it('should allow catching all Neogma errors with base class', () => {
      const errors = [
        new NeogmaError('base'),
        new NeogmaConstraintError('constraint'),
        new NeogmaNotFoundError('not found'),
        new NeogmaConnectivityError(),
        new NeogmaInstanceValidationError('validation', {
          model: {} as any,
          errors: [],
        }),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(NeogmaError);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should allow specific error type catching', () => {
      const handleError = (error: Error): string => {
        if (error instanceof NeogmaNotFoundError) {
          return 'not_found';
        }
        if (error instanceof NeogmaConstraintError) {
          return 'constraint';
        }
        if (error instanceof NeogmaConnectivityError) {
          return 'connectivity';
        }
        if (error instanceof NeogmaInstanceValidationError) {
          return 'validation';
        }
        if (error instanceof NeogmaError) {
          return 'neogma_generic';
        }
        return 'unknown';
      };

      expect(handleError(new NeogmaNotFoundError('test'))).toBe('not_found');
      expect(handleError(new NeogmaConstraintError('test'))).toBe('constraint');
      expect(handleError(new NeogmaConnectivityError())).toBe('connectivity');
      expect(
        handleError(
          new NeogmaInstanceValidationError('test', {
            model: {} as any,
            errors: [],
          }),
        ),
      ).toBe('validation');
      expect(handleError(new NeogmaError('test'))).toBe('neogma_generic');
      expect(handleError(new Error('test'))).toBe('unknown');
    });
  });
});
