import { Literal } from '../../Literal';
import { Op } from '../../Where';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getWhereString', () => {
  it('generates a where statement by a literal', () => {
    const literal = 'a.id = 5';
    const queryBuilder = new QueryBuilder().where(literal);

    expectStatementEquals(queryBuilder, `WHERE ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a where statement using objects', () => {
    const queryBuilder = new QueryBuilder().where({
      i1: {
        id: '20',
      },
      i2: {
        id: '21',
        name: 'J',
      },
      i3: {
        id: {
          [Op.gt]: new Literal('i2.id'),
        },
      },
    });

    expectStatementEquals(
      queryBuilder,
      'WHERE i1.id = $id AND i2.id = $id__aaaa AND i2.name = $name AND i3.id > i2.id',
    );
    expectBindParamEquals(queryBuilder, {
      id: '20',
      id__aaaa: '21',
      name: 'J',
    });
  });

  it('generates a where statement with multiple operators', () => {
    const queryBuilder = new QueryBuilder().where({
      n: {
        age: {
          [Op.gte]: 18,
          [Op.lte]: 65,
        },
      },
    });

    expectStatementEquals(
      queryBuilder,
      'WHERE n.age >= $age AND n.age <= $age__aaaa',
    );
    expectBindParamEquals(queryBuilder, {
      age: 18,
      age__aaaa: 65,
    });
  });

  it('generates a where statement with IN operator', () => {
    const queryBuilder = new QueryBuilder().where({
      n: {
        status: {
          [Op.in]: ['active', 'pending'],
        },
      },
    });

    expectStatementEquals(queryBuilder, 'WHERE n.status IN $status');
    expectBindParamEquals(queryBuilder, {
      status: ['active', 'pending'],
    });
  });

  it('generates a where statement with CONTAINS operator', () => {
    const queryBuilder = new QueryBuilder().where({
      n: {
        name: {
          [Op.contains]: 'test',
        },
      },
    });

    expectStatementEquals(queryBuilder, 'WHERE n.name CONTAINS $name');
    expectBindParamEquals(queryBuilder, {
      name: 'test',
    });
  });

  describe('type safety', () => {
    it('accepts valid where string parameter', () => {
      const qb = new QueryBuilder();
      qb.where('n.name = "test"');
      expect(qb.getStatement()).toContain('WHERE n.name = "test"');
    });

    it('accepts valid where object parameter', () => {
      const qb = new QueryBuilder();
      qb.where({ n: { name: 'test' } });
      expect(qb.getStatement()).toContain('WHERE');
    });

    it('accepts where with operators', () => {
      const qb = new QueryBuilder();
      qb.where({ n: { age: { [Op.gt]: 18 } } });
      expect(qb.getStatement()).toContain('WHERE n.age > $age');
    });

    it('rejects invalid where parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - where requires string or where object, not number
        qb.where(123);
      }).toThrow("Invalid 'where' value");
    });

    it('rejects where with array parameter', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - where requires string or where object, not array
      // This is a type-only test - array indices become escaped identifiers at runtime
      void qb.where(['a', 'b']);
    });

    it('rejects where with boolean parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - where requires string or where object, not boolean
        qb.where(true);
      }).toThrow("Invalid 'where' value");
    });

    it('rejects where with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.where('');
      }).toThrow("Invalid 'where' value");
    });

    it('rejects where with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.where('   ');
      }).toThrow("Invalid 'where' value");
    });
  });
});
