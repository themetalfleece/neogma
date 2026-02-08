import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getCallString', () => {
  it('generates a call statement with a literal string', () => {
    const subquery = 'MATCH (n) RETURN n';
    const queryBuilder = new QueryBuilder().call(subquery);

    // QueryBuilder normalizes whitespace (including newlines) to single spaces
    expectStatementEquals(queryBuilder, `CALL { ${subquery} }`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a call statement with a complex subquery', () => {
    const subquery =
      'MATCH (n:User) WHERE n.active = true RETURN n.name AS name';
    const queryBuilder = new QueryBuilder().call(subquery);

    // QueryBuilder normalizes whitespace (including newlines) to single spaces
    expectStatementEquals(queryBuilder, `CALL { ${subquery} }`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid call string parameter', () => {
      const qb = new QueryBuilder();
      qb.call('MATCH (n) RETURN n');
      expect(qb.getStatement()).toContain('CALL {');
    });

    it('rejects invalid call parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - call requires string, not number
        qb.call(123);
      }).toThrow("Invalid 'call' value");
    });

    it('rejects call with object parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - call requires string, not object
        qb.call({ query: 'test' });
      }).toThrow("Invalid 'call' value");
    });

    it('rejects call with array parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - call requires string, not array
        qb.call(['a', 'b']);
      }).toThrow("Invalid 'call' value");
    });

    it('rejects call with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.call('');
      }).toThrow("Invalid 'call' value");
    });

    it('rejects call with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.call('   ');
      }).toThrow("Invalid 'call' value");
    });
  });
});
