import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';
import { isUnwindObject } from './getUnwindString.types';

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

  describe('escaping behavior', () => {
    it('escapes as identifier with special characters', () => {
      const queryBuilder = new QueryBuilder().unwind({
        value: '$items',
        as: 'my-item',
      });
      expectStatementEquals(queryBuilder, 'UNWIND $items AS `my-item`');
    });

    it('does not escape valid as identifier', () => {
      const queryBuilder = new QueryBuilder().unwind({
        value: '$items',
        as: 'validItem',
      });
      expectStatementEquals(queryBuilder, 'UNWIND $items AS validItem');
    });

    it('escapes as identifier starting with number', () => {
      const queryBuilder = new QueryBuilder().unwind({
        value: '[1, 2, 3]',
        as: '123item',
      });
      expectStatementEquals(queryBuilder, 'UNWIND [1, 2, 3] AS `123item`');
    });
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
      expect(() => {
        // @ts-expect-error - unwind requires string or unwind object, not number
        qb.unwind(123);
      }).toThrow("Invalid 'unwind' value");
    });

    it('rejects unwind with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.unwind('');
      }).toThrow("Invalid 'unwind' value");
    });

    it('rejects unwind with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.unwind('   ');
      }).toThrow("Invalid 'unwind' value");
    });
  });

  describe('type guard', () => {
    it('isUnwindObject returns true for valid object parameter', () => {
      const param = { value: '$items', as: 'item' };
      expect(isUnwindObject(param)).toBe(true);
    });

    it('isUnwindObject returns false for string parameter', () => {
      const param = '[1, 2, 3] as arr';
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object with empty value', () => {
      const param = { value: '', as: 'item' };
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object with empty as', () => {
      const param = { value: '$items', as: '' };
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object missing value', () => {
      const param = { as: 'item' };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object missing as', () => {
      const param = { value: '$items' };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object with whitespace-only value', () => {
      const param = { value: '   ', as: 'item' };
      expect(isUnwindObject(param)).toBe(false);
    });

    it('isUnwindObject returns false for object with whitespace-only as', () => {
      const param = { value: '$items', as: '   ' };
      expect(isUnwindObject(param)).toBe(false);
    });
  });
});
