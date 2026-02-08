import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getForEachString', () => {
  it('generates a forEach statement by a literal string', () => {
    const literal = '(n IN nodes | SET n.marked = true)';
    const queryBuilder = new QueryBuilder().forEach(literal);

    expectStatementEquals(queryBuilder, `FOR EACH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a forEach statement with nested operations', () => {
    const literal = '(name IN $names | CREATE (:Person {name: name}))';
    const queryBuilder = new QueryBuilder().forEach(literal);

    expectStatementEquals(queryBuilder, `FOR EACH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a forEach statement with complex iteration', () => {
    const literal = '(i IN range(1, 10) | CREATE (:Node {index: i}))';
    const queryBuilder = new QueryBuilder().forEach(literal);

    expectStatementEquals(queryBuilder, `FOR EACH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid forEach string parameter', () => {
      const qb = new QueryBuilder();
      qb.forEach('(n IN nodes | SET n.processed = true)');
      expect(qb.getStatement()).toContain('FOR EACH');
    });

    it('rejects invalid forEach parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - forEach requires string, not number
        qb.forEach(123);
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with object parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - forEach requires string, not object
        qb.forEach({ value: 'test' });
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with array parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - forEach requires string, not array
        qb.forEach(['a', 'b']);
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with boolean parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - forEach requires string, not boolean
        qb.forEach(true);
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with null parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - forEach requires string, not null
        qb.forEach(null);
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.forEach('');
      }).toThrow("Invalid 'forEach' value");
    });

    it('rejects forEach with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.forEach('   ');
      }).toThrow("Invalid 'forEach' value");
    });
  });
});
