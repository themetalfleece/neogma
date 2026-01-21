import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

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
      // @ts-expect-error - orderBy requires string, array, or object, not number
      void qb.orderBy(123);
    });

    it('rejects orderBy object with invalid direction', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - direction must be 'ASC' or 'DESC', not 'INVALID'
      void qb.orderBy({ identifier: 'n', direction: 'INVALID' });
    });
  });
});
