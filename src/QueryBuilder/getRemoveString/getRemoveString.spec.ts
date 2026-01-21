import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getRemoveString', () => {
  it('generates a remove statement by a literal', () => {
    const literal = 'a.name';
    const queryBuilder = new QueryBuilder().remove(literal);

    expectStatementEquals(queryBuilder, `REMOVE ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a remove of properties statement by an object', () => {
    const queryBuilder = new QueryBuilder().remove({
      identifier: 'a',
      properties: ['p1', 'p2'],
    });

    expectStatementEquals(queryBuilder, `REMOVE a.p1, a.p2`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a remove of labels statement by an object', () => {
    const queryBuilder = new QueryBuilder().remove({
      identifier: 'a',
      labels: ['l1', 'l2'],
    });

    expectStatementEquals(queryBuilder, `REMOVE a:l1:l2`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid remove string parameter', () => {
      const qb = new QueryBuilder();
      qb.remove('n.name');
      expect(qb.getStatement()).toContain('REMOVE n.name');
    });

    it('accepts valid remove properties object', () => {
      const qb = new QueryBuilder();
      qb.remove({ identifier: 'n', properties: ['name', 'age'] });
      expect(qb.getStatement()).toContain('REMOVE n.name, n.age');
    });

    it('accepts valid remove labels object', () => {
      const qb = new QueryBuilder();
      qb.remove({ identifier: 'n', labels: ['Label1', 'Label2'] });
      expect(qb.getStatement()).toContain('REMOVE n:Label1:Label2');
    });

    it('rejects invalid remove parameter type', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - remove requires string or remove object, not number
        qb.remove(123);
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
