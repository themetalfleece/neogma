import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getUnwindString', () => {
  it('generates an unwind statement by a literal', () => {
    const literal = '[1, 2, 3] as arr';
    const queryBuilder = new QueryBuilder().unwind(literal);

    expectStatementEquals(queryBuilder, `UNWIND ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an unwind statement by an object', () => {
    const queryBuilder = new QueryBuilder().unwind({
      value: 'x',
      as: 'y',
    });

    expectStatementEquals(queryBuilder, `UNWIND x AS y`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('type safety', () => {
    it('accepts valid unwind string parameter', () => {
      const qb = new QueryBuilder();
      qb.unwind('[1, 2, 3] as arr');
      expect(qb.getStatement()).toContain('UNWIND [1, 2, 3] as arr');
    });

    it('accepts valid unwind object parameter', () => {
      const qb = new QueryBuilder();
      qb.unwind({ value: '$list', as: 'item' });
      expect(qb.getStatement()).toContain('UNWIND $list AS item');
    });

    it('rejects invalid unwind parameter type', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - unwind requires string or unwind object, not number
      void qb.unwind(123);
    });
  });
});
