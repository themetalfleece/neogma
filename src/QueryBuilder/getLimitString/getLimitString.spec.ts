import { neo4jDriver } from '../..';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getLimitString', () => {
  it('generates a limit statement by a literal', () => {
    const literal = '2';
    const queryBuilder = new QueryBuilder().limit(literal);

    expectStatementEquals(queryBuilder, `LIMIT ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a limit statement by a number', () => {
    const literal = 1;
    const queryBuilder = new QueryBuilder().limit(literal);

    expectStatementEquals(queryBuilder, `LIMIT $limit`);
    expectBindParamEquals(queryBuilder, { limit: neo4jDriver.int(1) });
  });

  describe('type safety', () => {
    it('accepts valid limit string parameter', () => {
      const qb = new QueryBuilder();
      qb.limit('10');
      expect(qb.getStatement()).toContain('LIMIT 10');
    });

    it('accepts valid limit number parameter', () => {
      const qb = new QueryBuilder();
      qb.limit(10);
      expect(qb.getStatement()).toContain('LIMIT $limit');
    });

    it('rejects invalid limit parameter type', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - limit requires string or number, not boolean
      void qb.limit(true);
    });
  });
});
