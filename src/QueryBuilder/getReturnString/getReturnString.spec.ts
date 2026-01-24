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

    it('rejects invalid return parameter type', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - return requires string, string[], or return object array, not number
        qb.return(123);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects return object array with missing identifier', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - return object requires identifier property
        qb.return([{ property: 'name' }]);
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
