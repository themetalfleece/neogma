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

  describe('call', () => {
    it('generates a CALL subquery with a string', () => {
      const queryBuilder = new QueryBuilder()
        .match({ identifier: 'n', label: 'Person' })
        .call(
          'WITH n MATCH (n)-[:KNOWS]->(friend) RETURN count(friend) as friendCount',
        )
        .return(['n', 'friendCount']);

      expectStatementEquals(
        queryBuilder,
        'MATCH (n:Person) CALL { WITH n MATCH (n)-[:KNOWS]->(friend) RETURN count(friend) as friendCount } RETURN n, friendCount',
      );
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates a CALL subquery with another QueryBuilder', () => {
      const subquery = new QueryBuilder()
        .with('n')
        .match({ literal: '(n)-[:KNOWS]->(friend)', optional: false })
        .return('count(friend) as friendCount');

      const queryBuilder = new QueryBuilder()
        .match({ identifier: 'n', label: 'Person' })
        .call(subquery)
        .return(['n', 'friendCount']);

      expectStatementEquals(
        queryBuilder,
        'MATCH (n:Person) CALL { WITH n MATCH (n)-[:KNOWS]->(friend) RETURN count(friend) as friendCount } RETURN n, friendCount',
      );
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates nested CALL subqueries', () => {
      const innerSubquery = new QueryBuilder()
        .with('friend')
        .match({ literal: '(friend)-[:WORKS_AT]->(company)', optional: true })
        .return('collect(company) as companies');

      const outerSubquery = new QueryBuilder()
        .with('n')
        .match({ literal: '(n)-[:KNOWS]->(friend)', optional: true })
        .call(innerSubquery)
        .return('collect({ friend: friend, companies: companies }) as friends');

      const queryBuilder = new QueryBuilder()
        .match({ identifier: 'n', label: 'Person' })
        .call(outerSubquery)
        .return(['n', 'friends']);

      // The nested CALL should be properly wrapped
      expect(queryBuilder.getStatement()).toContain('CALL {');
      expect(queryBuilder.getStatement()).toContain('RETURN n, friends');
    });

    describe('type safety', () => {
      it('accepts valid call string parameter', () => {
        const qb = new QueryBuilder();
        qb.call('WITH n RETURN count(n)');
        expect(qb.getStatement()).toContain('CALL {');
      });

      it('accepts QueryBuilder as parameter', () => {
        const subquery = new QueryBuilder().with('n').return('n');
        const qb = new QueryBuilder();
        qb.call(subquery);
        expect(qb.getStatement()).toContain('CALL {');
      });

      it('rejects invalid call parameter type', () => {
        const qb = new QueryBuilder();
        // @ts-expect-error - call requires string or QueryBuilder, not number
        void qb.call(123);
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
