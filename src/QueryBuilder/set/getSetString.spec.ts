import { Literal } from '../../Literal';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getSetString', () => {
  it('generates a set statement by a literal', () => {
    const literal = 'a.name = "K"';
    const queryBuilder = new QueryBuilder().set(literal);

    expectStatementEquals(queryBuilder, `SET ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a set statement using objects', () => {
    const queryBuilder = new QueryBuilder().set({
      identifier: 'a',
      properties: {
        name: 'K',
        available: 5,
        someLiteral: new Literal('"exact literal"'),
      },
    });

    expectStatementEquals(
      queryBuilder,
      'SET a.name = $name, a.available = $available, a.someLiteral = "exact literal"',
    );
    expectBindParamEquals(queryBuilder, {
      name: 'K',
      available: 5,
    });
  });

  describe('type safety', () => {
    it('accepts valid set string parameter', () => {
      const qb = new QueryBuilder();
      qb.set('n.name = "test"');
      expect(qb.getStatement()).toContain('SET n.name = "test"');
    });

    it('accepts valid set object parameter', () => {
      const qb = new QueryBuilder();
      qb.set({ identifier: 'n', properties: { name: 'test' } });
      expect(qb.getStatement()).toContain('SET');
    });

    it('rejects invalid set parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - set requires string or set object, not number
        qb.set(123);
      }).toThrow("Invalid 'set' value");
    });

    it('rejects set with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.set('');
      }).toThrow("Invalid 'set' value");
    });

    it('rejects set with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.set('   ');
      }).toThrow("Invalid 'set' value");
    });

    it('rejects set object with whitespace-only identifier', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.set({ identifier: '   ', properties: { name: 'test' } });
      }).toThrow("Invalid 'set' value");
    });
  });
});
