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

    // Valid labels are not escaped
    expectStatementEquals(queryBuilder, 'REMOVE a:l1:l2');
    expectBindParamEquals(queryBuilder, {});
  });

  describe('security', () => {
    it('escapes property names with special characters', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        properties: ['name; DELETE (n)'],
      });
      // Property is escaped with backticks
      expectStatementEquals(queryBuilder, 'REMOVE n.`name; DELETE (n)`');
    });

    it('escapes property names with backticks', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        properties: ['`injection`'],
      });
      // Backticks are escaped by doubling them
      expectStatementEquals(queryBuilder, 'REMOVE n.```injection```');
    });

    it('escapes property names starting with numbers', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        properties: ['123prop'],
      });
      expectStatementEquals(queryBuilder, 'REMOVE n.`123prop`');
    });

    it('escapes labels with backticks to prevent injection', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        labels: ['Label`Injection'],
      });
      // Backticks are escaped by doubling them
      expectStatementEquals(queryBuilder, 'REMOVE n:`Label``Injection`');
    });

    it('escapes labels with special characters', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        labels: ['My Label'],
      });
      // Spaces are handled by backtick escaping
      expectStatementEquals(queryBuilder, 'REMOVE n:`My Label`');
    });

    it('does not escape valid property names with underscores', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        properties: ['my_valid_prop'],
      });
      expectStatementEquals(queryBuilder, 'REMOVE n.my_valid_prop');
    });

    it('escapes identifier with special characters for properties', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'my-node',
        properties: ['name'],
      });
      expectStatementEquals(queryBuilder, 'REMOVE `my-node`.name');
    });

    it('escapes identifier with special characters for labels', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'my-node',
        labels: ['Label'],
      });
      // Identifier is escaped, Label is a valid identifier so not escaped
      expectStatementEquals(queryBuilder, 'REMOVE `my-node`:Label');
    });

    it('does not double-escape pre-escaped labels', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: 'n',
        labels: ['`My Label`'],
      });
      // Pre-escaped labels are returned unchanged (idempotent)
      expectStatementEquals(queryBuilder, 'REMOVE n:`My Label`');
    });

    it('escapes identifier starting with number', () => {
      const queryBuilder = new QueryBuilder().remove({
        identifier: '123node',
        properties: ['name'],
      });
      expectStatementEquals(queryBuilder, 'REMOVE `123node`.name');
    });
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
      // Valid labels are not escaped
      expect(qb.getStatement()).toContain('REMOVE n:Label1:Label2');
    });

    it('rejects invalid remove parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - remove requires string or remove object, not number
        qb.remove(123);
      }).toThrow("Invalid 'remove' value");
    });
  });

  describe('validation edge cases', () => {
    it('treats empty identifier for properties as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: '',
          properties: ['name'],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveProperties');
    });

    it('treats empty properties array as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          properties: [],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveProperties');
    });

    it('treats empty properties string as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          properties: '',
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveProperties');
    });

    it('treats empty identifier for labels as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: '',
          labels: ['Label'],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveLabels');
    });

    it('treats empty labels array as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          labels: [],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveLabels');
    });

    it('treats empty labels string as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          labels: '',
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveLabels');
    });

    it('treats array with empty string property as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          properties: ['name', ''],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveProperties');
    });

    it('treats array with empty string label as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.remove({
          identifier: 'n',
          labels: ['Label', ''],
        } as Parameters<typeof qb.remove>[0]),
      ).toThrow('Invalid RemoveLabels');
    });
  });
});
