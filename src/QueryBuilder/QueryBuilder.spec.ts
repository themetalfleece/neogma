import { neo4jDriver } from '..';
import { QueryBuilder } from './QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  ModelA,
  neogma,
} from './testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('QueryBuilder', () => {
  describe('raw', () => {
    it('generates a raw statement', () => {
      const rawStatement = 'MATCH (a:A) RETURN a';
      const queryBuilder = new QueryBuilder().raw(rawStatement);

      expectStatementEquals(queryBuilder, rawStatement);
      expectBindParamEquals(queryBuilder, {});
    });

    describe('type safety', () => {
      it('accepts valid raw string parameter', () => {
        const qb = new QueryBuilder();
        qb.raw('MATCH (n) RETURN n');
        expect(qb.getStatement()).toBe('MATCH (n) RETURN n');
      });

      it('rejects invalid raw parameter type', () => {
        const qb = new QueryBuilder();
        // @ts-expect-error - raw requires string, not number
        void qb.raw(123);
      });
    });
  });

  describe('method chaining', () => {
    it('adds multiple params by chaining method calls', () => {
      const queryBuilder = new QueryBuilder()
        .match({
          identifier: 'a',
          where: {
            p1: 'v1',
          },
        })
        .limit(1)
        .return('a');

      expectStatementEquals(
        queryBuilder,
        'MATCH (a { p1: $p1 }) LIMIT $limit RETURN a',
      );
      expectBindParamEquals(queryBuilder, {
        p1: 'v1',
        limit: neo4jDriver.int(1),
      });
    });

    describe('type safety', () => {
      it('method chaining returns QueryBuilder', () => {
        const qb = new QueryBuilder()
          .match({ identifier: 'n' })
          .where({ n: { name: 'test' } })
          .return('n')
          .limit(10);

        expect(qb).toBeInstanceOf(QueryBuilder);
        expect(typeof qb.getStatement).toBe('function');
        expect(typeof qb.getBindParam).toBe('function');
      });
    });
  });

  describe('addParams', () => {
    it('adds new params to the query by using an array', () => {
      const queryBuilder = new QueryBuilder().addParams([
        {
          match: {
            identifier: 'a',
            where: {
              p1: 'v1',
            },
          },
        },
      ]);

      queryBuilder.addParams([
        {
          limit: 1,
        },
        {
          return: 'a',
        },
      ]);

      expectStatementEquals(
        queryBuilder,
        'MATCH (a { p1: $p1 }) LIMIT $limit RETURN a',
      );
      expectBindParamEquals(queryBuilder, {
        p1: 'v1',
        limit: neo4jDriver.int(1),
      });
    });

    it('adds new params to the query by using an object', () => {
      const queryBuilder = new QueryBuilder().addParams([
        {
          match: {
            identifier: 'a',
            where: {
              p1: 'v1',
            },
          },
        },
      ]);

      queryBuilder.addParams({
        limit: 1,
      });

      expectStatementEquals(queryBuilder, 'MATCH (a { p1: $p1 }) LIMIT $limit');
      expectBindParamEquals(queryBuilder, {
        p1: 'v1',
        limit: neo4jDriver.int(1),
      });
    });

    it('adds new params to the query by using many objects (rest param)', () => {
      const queryBuilder = new QueryBuilder().addParams([
        {
          match: {
            identifier: 'a',
            where: {
              p1: 'v1',
            },
          },
        },
      ]);

      queryBuilder.addParams(
        {
          limit: 1,
        },
        {
          return: 'a',
        },
      );

      expectStatementEquals(
        queryBuilder,
        'MATCH (a { p1: $p1 }) LIMIT $limit RETURN a',
      );
      expectBindParamEquals(queryBuilder, {
        p1: 'v1',
        limit: neo4jDriver.int(1),
      });
    });
  });

  describe('run', () => {
    it('runs an instance with a given QueryRunner instance', async () => {
      const res = await new QueryBuilder()
        .raw('return "test"')
        .run(neogma.queryRunner);

      expect(res.records[0].get(`"test"`)).toBe('test');
    });

    it('runs an instance with the set queryRunner field', async () => {
      const initialValue = QueryBuilder.queryRunner;
      QueryBuilder.queryRunner = neogma.queryRunner;
      const res = await new QueryBuilder().raw('return "test"').run();

      expect(res.records[0].get(`"test"`)).toBe('test');

      // set it back to the initial value
      QueryBuilder.queryRunner = initialValue;
    });
  });

  describe('integration', () => {
    it('does not crash when generating parameters which are not properly unit-tested', () => {
      const queryBuilder = new QueryBuilder().addParams([
        {
          create: '(n1:Location)',
        },
        {
          create: {
            multiple: [
              {
                model: ModelA,
              },
              {
                identifier: 'n2',
                label: 'Location',
              },
            ],
          },
        },
        {
          create: {
            identifier: 'n3',
            label: 'Location',
          },
        },
        {
          create: {
            identifier: 'n4',
            model: ModelA,
          },
        },
        {
          create: {
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
          },
        },
        {
          merge: {
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
          },
        },
      ]);

      expectStatementEquals(
        queryBuilder,
        'CREATE (n1:Location) CREATE (:`ModelA`), (n2:Location) CREATE (n3:Location) CREATE (n4:`ModelA`) CREATE (n4:Location)-[:HAS]->(n5:`ModelA` { testProp: $testProp })<-[:CREATES]-(n6:User) MERGE (n7:Location)-[:HAS { testProp: $testProp__aaaa }]->(n8:`ModelA`)<-[:CREATES]-(n9:User)',
      );
      expectBindParamEquals(queryBuilder, {
        testProp: true,
        testProp__aaaa: '2',
      });
    });
  });
});
