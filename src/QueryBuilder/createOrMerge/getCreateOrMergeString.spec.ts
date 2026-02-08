import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  ModelA,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getCreateOrMergeString', () => {
  describe('create', () => {
    it('generates a create statement by a literal string', () => {
      const literal = '(n1:Location)';
      const queryBuilder = new QueryBuilder().create(literal);

      expectStatementEquals(queryBuilder, `CREATE ${literal}`);
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates a create statement by multiple nodes', () => {
      const queryBuilder = new QueryBuilder().create({
        multiple: [
          {
            model: ModelA,
          },
          {
            identifier: 'n2',
            label: 'Location',
          },
        ],
      });

      expectStatementEquals(queryBuilder, 'CREATE (:`ModelA`), (n2:Location)');
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates a create statement by identifier and label', () => {
      const queryBuilder = new QueryBuilder().create({
        identifier: 'n3',
        label: 'Location',
      });

      expectStatementEquals(queryBuilder, 'CREATE (n3:Location)');
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates a create statement by identifier and model', () => {
      const queryBuilder = new QueryBuilder().create({
        identifier: 'n4',
        model: ModelA,
      });

      expectStatementEquals(queryBuilder, 'CREATE (n4:`ModelA`)');
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates a create statement with related nodes', () => {
      const queryBuilder = new QueryBuilder().create({
        related: [
          {
            identifier: 'n4',
            label: 'Location',
          },
          {
            direction: 'out',
            name: 'HAS',
          },
          {
            identifier: 'n5',
            model: ModelA,
            properties: {
              testProp: true,
            },
          },
          {
            direction: 'in',
            name: 'CREATES',
          },
          {
            identifier: 'n6',
            label: 'User',
          },
        ],
      });

      expectStatementEquals(
        queryBuilder,
        'CREATE (n4:Location)-[:HAS]->(n5:`ModelA` { testProp: $testProp })<-[:CREATES]-(n6:User)',
      );
      expectBindParamEquals(queryBuilder, { testProp: true });
    });
  });

  describe('merge', () => {
    it('generates a merge statement with related nodes and properties', () => {
      const queryBuilder = new QueryBuilder().merge({
        related: [
          {
            identifier: 'n7',
            label: 'Location',
          },
          {
            direction: 'out',
            name: 'HAS',
            properties: {
              testProp: '2',
            },
          },
          {
            identifier: 'n8',
            model: ModelA,
          },
          {
            direction: 'in',
            name: 'CREATES',
          },
          {
            identifier: 'n9',
            label: 'User',
          },
        ],
      });

      expectStatementEquals(
        queryBuilder,
        'MERGE (n7:Location)-[:HAS { testProp: $testProp }]->(n8:`ModelA`)<-[:CREATES]-(n9:User)',
      );
      expectBindParamEquals(queryBuilder, { testProp: '2' });
    });
  });

  describe('type safety', () => {
    it('accepts valid create string parameter', () => {
      const qb = new QueryBuilder();
      qb.create('(n:Node)');
      expect(qb.getStatement()).toContain('CREATE');
    });

    it('accepts valid create object with label', () => {
      const qb = new QueryBuilder();
      qb.create({ identifier: 'n', label: 'MyLabel' });
      expect(qb.getStatement()).toContain('CREATE (n:MyLabel)');
    });

    it('rejects invalid create parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - create requires string or create object, not number
        qb.create(123);
      }).toThrow("Invalid 'create' value");
    });

    it('rejects create with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.create('');
      }).toThrow("Invalid 'create' value");
    });

    it('rejects create with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.create('   ');
      }).toThrow("Invalid 'create' value");
    });

    it('rejects create with array parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - create requires string or create object, not array
        qb.create(['(n)', '(m)']);
      }).toThrow("Invalid 'create' value");
    });

    it('rejects invalid merge parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - merge requires string or merge object, not number
        qb.merge(123);
      }).toThrow("Invalid 'merge' value");
    });

    it('rejects merge with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.merge('');
      }).toThrow("Invalid 'merge' value");
    });

    it('rejects merge with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.merge('   ');
      }).toThrow("Invalid 'merge' value");
    });

    it('rejects merge with array parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - merge requires string or merge object, not array
        qb.merge(['(n)', '(m)']);
      }).toThrow("Invalid 'merge' value");
    });
  });
});
