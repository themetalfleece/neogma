import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';
import { isOrderByObject } from './getOrderByString.types';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getOrderByString', () => {
  it('generates an orderBy statement by a literal', () => {
    const literal = 'a ASC';
    const queryBuilder = new QueryBuilder().orderBy(literal);

    expectStatementEquals(queryBuilder, `ORDER BY ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an array of literal strings', () => {
    const queryBuilder = new QueryBuilder().orderBy(['a', 'b DESC', 'c ASC']);

    expectStatementEquals(queryBuilder, `ORDER BY a, b DESC, c ASC`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an object with identifier', () => {
    const queryBuilder = new QueryBuilder().orderBy({
      identifier: 'a',
    });

    expectStatementEquals(queryBuilder, `ORDER BY a`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an object with identifier and direction', () => {
    const queryBuilder = new QueryBuilder().orderBy({
      identifier: 'a',
      direction: 'DESC',
    });

    expectStatementEquals(queryBuilder, `ORDER BY a DESC`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an object with identifier and property', () => {
    const queryBuilder = new QueryBuilder().orderBy({
      identifier: 'a',
      property: 'p1',
    });

    expectStatementEquals(queryBuilder, `ORDER BY a.p1`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an object with identifier, property and direction', () => {
    const queryBuilder = new QueryBuilder().orderBy({
      identifier: 'a',
      property: 'p1',
      direction: 'ASC',
    });

    expectStatementEquals(queryBuilder, `ORDER BY a.p1 ASC`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an orderBy statement by an object with an array of every combination', () => {
    const queryBuilder = new QueryBuilder().orderBy([
      'a',
      ['b', 'DESC'],
      {
        identifier: 'c',
      },
      {
        identifier: 'd',
        direction: 'DESC',
      },
      {
        identifier: 'e',
        property: 'p1',
      },
      {
        identifier: 'e',
        property: 'p1',
        direction: 'ASC',
      },
    ]);

    expectStatementEquals(
      queryBuilder,
      `ORDER BY a, b DESC, c, d DESC, e.p1, e.p1 ASC`,
    );
    expectBindParamEquals(queryBuilder, {});
  });

  describe('security', () => {
    it('escapes property names with special characters', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n',
        property: 'name; DELETE (n)',
      });
      // Property is escaped with backticks
      expectStatementEquals(queryBuilder, 'ORDER BY n.`name; DELETE (n)`');
    });

    it('escapes property names with backticks', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n',
        property: '`injection`',
      });
      // Backticks are escaped by doubling them
      expectStatementEquals(queryBuilder, 'ORDER BY n.```injection```');
    });

    it('escapes property names starting with numbers', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n',
        property: '123prop',
      });
      expectStatementEquals(queryBuilder, 'ORDER BY n.`123prop`');
    });

    it('escapes identifier with special characters', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n; DELETE (m)',
        property: 'name',
      });
      // Identifier is escaped with backticks
      expectStatementEquals(queryBuilder, 'ORDER BY `n; DELETE (m)`.name');
    });

    it('escapes property in array element', () => {
      const queryBuilder = new QueryBuilder().orderBy([
        {
          identifier: 'n',
          property: 'bad-prop',
        },
      ]);
      expectStatementEquals(queryBuilder, 'ORDER BY n.`bad-prop`');
    });

    it('does not escape valid property names with underscores', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n',
        property: 'my_valid_prop',
        direction: 'ASC',
      });
      expectStatementEquals(queryBuilder, 'ORDER BY n.my_valid_prop ASC');
    });

    it('does not escape property names starting with underscore', () => {
      const queryBuilder = new QueryBuilder().orderBy({
        identifier: 'n',
        property: '_internal',
        direction: 'DESC',
      });
      expectStatementEquals(queryBuilder, 'ORDER BY n._internal DESC');
    });
  });

  describe('type safety', () => {
    it('accepts valid orderBy string parameter', () => {
      const qb = new QueryBuilder();
      qb.orderBy('n.name ASC');
      expect(qb.getStatement()).toContain('ORDER BY n.name ASC');
    });

    it('accepts valid orderBy object parameter', () => {
      const qb = new QueryBuilder();
      qb.orderBy({ identifier: 'n', property: 'name', direction: 'DESC' });
      expect(qb.getStatement()).toContain('ORDER BY n.name DESC');
    });

    it('rejects invalid orderBy parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - orderBy requires string, array, or object, not number
        qb.orderBy(123);
      }).toThrow("Invalid 'orderBy' value");
    });

    it('rejects orderBy object with invalid direction', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - direction must be 'ASC' or 'DESC', not 'INVALID'
      void qb.orderBy({ identifier: 'n', direction: 'INVALID' });
    });

    it('rejects orderBy with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.orderBy('');
      }).toThrow("Invalid 'orderBy' value");
    });

    it('rejects orderBy with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.orderBy('   ');
      }).toThrow("Invalid 'orderBy' value");
    });

    it('rejects orderBy object with whitespace-only identifier', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.orderBy({ identifier: '   ' });
      }).toThrow("Invalid 'orderBy' value");
    });
  });

  describe('type guard', () => {
    it('isOrderByObject returns true for valid object with identifier only', () => {
      const param = { identifier: 'n' };
      expect(isOrderByObject(param)).toBe(true);
    });

    it('isOrderByObject returns true for valid object with all properties', () => {
      const param = {
        identifier: 'n',
        property: 'name',
        direction: 'DESC' as const,
      };
      expect(isOrderByObject(param)).toBe(true);
    });

    it('isOrderByObject returns false for string parameter', () => {
      const param = 'n.name ASC';
      expect(isOrderByObject(param)).toBe(false);
    });

    it('isOrderByObject returns false for array parameter', () => {
      const param = ['n.name ASC', 'n.age DESC'];
      expect(isOrderByObject(param)).toBe(false);
    });

    it('isOrderByObject returns false for object with empty identifier', () => {
      const param = { identifier: '' };
      expect(isOrderByObject(param)).toBe(false);
    });

    it('isOrderByObject returns false for object missing identifier', () => {
      const param = { property: 'name' };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isOrderByObject(param)).toBe(false);
    });

    it('isOrderByObject returns false for object with whitespace-only identifier', () => {
      const param = { identifier: '   ' };
      expect(isOrderByObject(param)).toBe(false);
    });
  });
});
