import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getWithString', () => {
  it('generates a with statement by a literal', () => {
    const literal = 'a';
    const queryBuilder = new QueryBuilder().with(literal);

    expectStatementEquals(queryBuilder, `WITH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a with statement by an array', () => {
    const queryBuilder = new QueryBuilder().with(['a', 'b']);

    expectStatementEquals(queryBuilder, `WITH a, b`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid with string parameter', () => {
      const qb = new QueryBuilder();
      qb.with('n');
      expect(qb.getStatement()).toContain('WITH n');
    });

    it('accepts valid with string array', () => {
      const qb = new QueryBuilder();
      qb.with(['n', 'm']);
      expect(qb.getStatement()).toContain('WITH n, m');
    });

    it('rejects invalid with parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - with requires string or string[], not number
        qb.with(123);
      }).toThrow("Invalid 'with' value");
    });

    it('rejects with with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.with('');
      }).toThrow("Invalid 'with' value");
    });

    it('rejects with with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.with('   ');
      }).toThrow("Invalid 'with' value");
    });

    it('rejects with array containing whitespace-only string', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.with(['n', '   ']);
      }).toThrow("Invalid 'with' value");
    });
  });
});
