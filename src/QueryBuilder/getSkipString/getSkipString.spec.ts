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

describe('getSkipString', () => {
  it('generates a skip statement by a literal', () => {
    const literal = '2';
    const queryBuilder = new QueryBuilder().skip(literal);

    expectStatementEquals(queryBuilder, `SKIP ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a skip statement by a number', () => {
    const literalNumber = 1;
    const queryBuilder = new QueryBuilder().skip(literalNumber);

    expectStatementEquals(queryBuilder, `SKIP $skip`);
    expectBindParamEquals(queryBuilder, { skip: neo4jDriver.int(1) });
  });

  describe('type safety', () => {
    it('accepts valid skip string parameter', () => {
      const qb = new QueryBuilder();
      qb.skip('5');
      expect(qb.getStatement()).toContain('SKIP 5');
    });

    it('accepts valid skip number parameter', () => {
      const qb = new QueryBuilder();
      qb.skip(5);
      expect(qb.getStatement()).toContain('SKIP $skip');
    });

    it('rejects invalid skip parameter type', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - skip requires string or number, not boolean
      void qb.skip(false);
    });
  });
});
