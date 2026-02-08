import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getRawString', () => {
  it('generates a raw statement with a literal string', () => {
    const literal = 'RETURN 1';
    const queryBuilder = new QueryBuilder().raw(literal);

    expectStatementEquals(queryBuilder, literal);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a raw statement with Cypher functions', () => {
    const literal = 'RETURN datetime() AS now';
    const queryBuilder = new QueryBuilder().raw(literal);

    expectStatementEquals(queryBuilder, literal);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a raw statement with complex expression', () => {
    const literal = 'MATCH (n) WHERE n.id = 1 RETURN n';
    const queryBuilder = new QueryBuilder().raw(literal);

    expectStatementEquals(queryBuilder, literal);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid raw string parameter', () => {
      const qb = new QueryBuilder();
      qb.raw('RETURN 1');
      expect(qb.getStatement()).toContain('RETURN 1');
    });

    it('rejects invalid raw parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - raw requires string, not number
        qb.raw(123);
      }).toThrow("Invalid 'raw' value");
    });

    it('rejects raw with object parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - raw requires string, not object
        qb.raw({ query: 'test' });
      }).toThrow("Invalid 'raw' value");
    });

    it('rejects raw with array parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - raw requires string, not array
        qb.raw(['a', 'b']);
      }).toThrow("Invalid 'raw' value");
    });

    it('rejects raw with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.raw('');
      }).toThrow("Invalid 'raw' value");
    });

    it('rejects raw with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.raw('   ');
      }).toThrow("Invalid 'raw' value");
    });
  });
});
