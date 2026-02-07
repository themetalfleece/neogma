import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getDeleteString', () => {
  it('generates a delete statement by a literal', () => {
    const literal = 'a';
    const queryBuilder = new QueryBuilder().delete(literal);

    expectStatementEquals(queryBuilder, `DELETE ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a detach delete statement by a literal object', () => {
    const literal = 'a';
    const queryBuilder = new QueryBuilder().delete({
      literal,
      detach: true,
    });

    expectStatementEquals(queryBuilder, `DETACH DELETE ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a delete statement by an identifiers array', () => {
    const queryBuilder = new QueryBuilder().delete({
      identifiers: ['a', 'b'],
    });

    expectStatementEquals(queryBuilder, `DELETE a, b`);
    expectBindParamEquals(queryBuilder, {});
  });

  describe('escaping behavior', () => {
    it('escapes identifiers with special characters', () => {
      const queryBuilder = new QueryBuilder().delete({
        identifiers: ['my-node'],
      });
      expectStatementEquals(queryBuilder, 'DELETE `my-node`');
    });

    it('escapes multiple identifiers with special characters', () => {
      const queryBuilder = new QueryBuilder().delete({
        identifiers: ['my-node', '123abc'],
        detach: true,
      });
      expectStatementEquals(queryBuilder, 'DETACH DELETE `my-node`, `123abc`');
    });

    it('does not escape valid identifiers', () => {
      const queryBuilder = new QueryBuilder().delete({
        identifiers: ['validNode', 'another_node'],
      });
      expectStatementEquals(queryBuilder, 'DELETE validNode, another_node');
    });

    it('escapes single identifier with special characters', () => {
      const queryBuilder = new QueryBuilder().delete({
        identifiers: 'my node',
      });
      expectStatementEquals(queryBuilder, 'DELETE `my node`');
    });
  });

  describe('type safety', () => {
    it('accepts valid delete string parameter', () => {
      const qb = new QueryBuilder();
      qb.delete('n');
      expect(qb.getStatement()).toContain('DELETE n');
    });

    it('accepts valid delete object with identifiers', () => {
      const qb = new QueryBuilder();
      qb.delete({ identifiers: ['n', 'm'], detach: true });
      expect(qb.getStatement()).toContain('DETACH DELETE n, m');
    });

    it('rejects invalid delete parameter type', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - delete requires string or delete object, not number
        qb.delete(123);
      };
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('validation edge cases', () => {
    it('treats empty identifiers string as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ identifiers: '' } as Parameters<typeof qb.delete>[0]),
      ).toThrow("Invalid 'identifiers' value");
    });

    it('treats empty identifiers array as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ identifiers: [] } as Parameters<typeof qb.delete>[0]),
      ).toThrow("Invalid 'identifiers' value");
    });

    it('treats whitespace-only identifier as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ identifiers: '   ' } as Parameters<typeof qb.delete>[0]),
      ).toThrow("Invalid 'identifiers' value");
    });

    it('treats array with empty string as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ identifiers: ['n', ''] } as Parameters<
          typeof qb.delete
        >[0]),
      ).toThrow("Invalid 'identifiers' value");
    });

    it('treats empty literal as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ literal: '' } as Parameters<typeof qb.delete>[0]),
      ).toThrow("Invalid 'literal' value");
    });

    it('treats whitespace-only literal as invalid', () => {
      const qb = new QueryBuilder();
      expect(() =>
        qb.delete({ literal: '   ' } as Parameters<typeof qb.delete>[0]),
      ).toThrow("Invalid 'literal' value");
    });
  });
});
