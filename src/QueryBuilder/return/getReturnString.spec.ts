import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getReturnString', () => {
  it('generates a return statement by a literal', () => {
    const literal = 'a, b.p1';
    const queryBuilder = new QueryBuilder().return(literal);

    expectStatementEquals(queryBuilder, `RETURN ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a return statement by an array of literals', () => {
    const queryBuilder = new QueryBuilder().return(['a', 'b.p1']);

    expectStatementEquals(queryBuilder, `RETURN a, b.p1`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a return statement by an array of objects of every combination', () => {
    const queryBuilder = new QueryBuilder().return([
      {
        identifier: 'a',
      },
      {
        identifier: 'b',
        property: 'p1',
      },
    ]);

    expectStatementEquals(queryBuilder, `RETURN a, b.p1`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('escaping behavior', () => {
    it('escapes identifiers with special characters', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'my-node' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN `my-node`');
    });

    it('escapes properties with special characters', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'n', property: 'my-property' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN n.`my-property`');
    });

    it('escapes both identifier and property when both have special characters', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'my node', property: 'first name' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN `my node`.`first name`');
    });

    it('does not escape valid identifiers', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'validNode', property: 'valid_prop' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN validNode.valid_prop');
    });

    it('escapes backticks in identifiers', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'test`node' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN `test``node`');
    });

    it('escapes identifiers starting with numbers', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: '123node', property: '456prop' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN `123node`.`456prop`');
    });
  });

  describe('mixed arrays', () => {
    it('handles mixed array with strings and objects', () => {
      const queryBuilder = new QueryBuilder().return([
        'count(n) AS total',
        { identifier: 'm', property: 'name' },
      ]);
      expectStatementEquals(queryBuilder, 'RETURN count(n) AS total, m.name');
    });

    it('handles mixed array with objects then strings', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'n' },
        'collect(m) AS items',
      ]);
      expectStatementEquals(queryBuilder, 'RETURN n, collect(m) AS items');
    });

    it('escapes object identifiers in mixed array but not strings', () => {
      const queryBuilder = new QueryBuilder().return([
        'raw-expression', // strings are raw - no escaping
        { identifier: 'my-node' }, // objects are escaped
      ]);
      expectStatementEquals(queryBuilder, 'RETURN raw-expression, `my-node`');
    });

    it('handles complex mixed array', () => {
      const queryBuilder = new QueryBuilder().return([
        { identifier: 'n', property: 'id' },
        'count(*) AS count',
        { identifier: 'my node', property: 'first name' },
        'collect(DISTINCT m.type) AS types',
      ]);
      expectStatementEquals(
        queryBuilder,
        'RETURN n.id, count(*) AS count, `my node`.`first name`, collect(DISTINCT m.type) AS types',
      );
    });
  });

  describe('type safety', () => {
    it('accepts valid return string parameter', () => {
      const qb = new QueryBuilder();
      qb.return('n');
      expect(qb.getStatement()).toContain('RETURN n');
    });

    it('accepts valid return string array', () => {
      const qb = new QueryBuilder();
      qb.return(['n', 'm']);
      expect(qb.getStatement()).toContain('RETURN n, m');
    });

    it('accepts valid return object array', () => {
      const qb = new QueryBuilder();
      qb.return([{ identifier: 'n' }, { identifier: 'm', property: 'name' }]);
      expect(qb.getStatement()).toContain('RETURN n, m.name');
    });

    it('accepts mixed array', () => {
      const qb = new QueryBuilder();
      qb.return(['n', { identifier: 'm' }]);
      expect(qb.getStatement()).toContain('RETURN n, m');
    });

    it('rejects invalid return parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - return requires string, string[], or return object array, not number
        qb.return(123);
      }).toThrow("Invalid 'return' value");
    });

    it('rejects return object array with missing identifier', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - return object requires identifier property
        qb.return([{ property: 'name' }]);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects return with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.return('');
      }).toThrow("Invalid 'return' value");
    });

    it('rejects return with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.return('   ');
      }).toThrow("Invalid 'return' value");
    });

    it('rejects return array containing whitespace-only string', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.return(['n', '   ']);
      }).toThrow("Invalid 'return' value");
    });

    it('rejects return object with whitespace-only identifier', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.return([{ identifier: '   ' }]);
      }).toThrow("Invalid 'return' value");
    });
  });
});
