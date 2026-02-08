import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { Op } from '../../Where';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  ModelA,
  ModelB,
  neogma,
} from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getMatchString', () => {
  it('generates a match statement by a literal string', () => {
    const literal = '(a:A)';
    const queryBuilder = new QueryBuilder().match(literal);

    expectStatementEquals(queryBuilder, `MATCH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by a literal object', () => {
    const literal = '(a:A)';
    const queryBuilder = new QueryBuilder().match({
      literal,
    });

    expectStatementEquals(queryBuilder, `MATCH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates an optional match statement by a literal object', () => {
    const literal = '(a:A)';
    const queryBuilder = new QueryBuilder().match({
      literal,
      optional: true,
    });

    expectStatementEquals(queryBuilder, `OPTIONAL MATCH ${literal}`);
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by using an empty object', () => {
    const queryBuilder = new QueryBuilder().match({});

    expectStatementEquals(queryBuilder, 'MATCH ()');
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by using an identifier', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
    });

    expectStatementEquals(queryBuilder, 'MATCH (a)');
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by using a label', () => {
    const queryBuilder = new QueryBuilder().match({
      label: 'MyLabel',
    });

    expectStatementEquals(queryBuilder, 'MATCH (:MyLabel)');
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by using a Model', () => {
    const queryBuilder = new QueryBuilder().match({
      model: ModelA,
    });

    expectStatementEquals(queryBuilder, 'MATCH (:`ModelA`)');
    expectBindParamEquals(queryBuilder, {});
  });

  it('generates a match statement by using a where', () => {
    const queryBuilder = new QueryBuilder().match({
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH ({ id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by using an identifier and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH (a { id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by using a label and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      label: 'MyLabel',
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH (:MyLabel { id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by using a Model and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      model: ModelA,
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH (:`ModelA` { id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by using an identifier, a label and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
      label: 'MyLabel',
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH (a:MyLabel { id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by using an identifier, a Model and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
      model: ModelA,
      where: {
        id: '20',
      },
    });

    expectStatementEquals(queryBuilder, 'MATCH (a:`ModelA` { id: $id })');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates an optional match statement by using an identifier, a label and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
      label: 'MyLabel',
      where: {
        id: '20',
      },
      optional: true,
    });

    expectStatementEquals(
      queryBuilder,
      'OPTIONAL MATCH (a:MyLabel { id: $id })',
    );
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates an optional match statement by using an identifier, a Model and a where', () => {
    const queryBuilder = new QueryBuilder().match({
      identifier: 'a',
      model: ModelA,
      where: {
        id: '20',
      },
      optional: true,
    });

    expectStatementEquals(
      queryBuilder,
      'OPTIONAL MATCH (a:`ModelA` { id: $id })',
    );
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement for multiple nodes', () => {
    const queryBuilder = new QueryBuilder().match({
      multiple: [
        {
          identifier: 'a',
          model: ModelA,
          where: {
            id: '20',
          },
        },
        {
          identifier: 'b',
        },
      ],
    });

    expectStatementEquals(queryBuilder, 'MATCH (a:`ModelA` { id: $id }), (b)');
    expectBindParamEquals(queryBuilder, { id: '20' });
  });

  it('generates a match statement by relating models with every relationship combination', () => {
    const queryBuilder = new QueryBuilder().match({
      related: [
        {
          identifier: 'a1',
        },
        {
          direction: 'in',
        },
        {
          label: 'MyLabelA1',
        },
        {
          direction: 'out',
          name: 'RelationshipName1',
        },
        {
          identifier: 'a2',
          label: 'MyLabelA2',
        },
        {
          direction: 'none',
          identifier: 'r1',
        },
        {
          model: ModelA,
        },
        {
          direction: 'in',
          where: {
            relProp1: 1,
            someLiteral: new Literal('"exact literal"'),
          },
        },
        {},
        {
          direction: 'out',
          name: 'RelationshipName2',
          identifier: 'r2',
        },
        {
          where: {
            id: '20',
          },
        },
        {
          direction: 'in',
          name: 'RelationshipName3',
          where: {
            relProp2: 2,
          },
        },
        {
          identifier: 'a3',
          where: {
            age: 26,
          },
        },
        {
          direction: 'none',
          identifier: 'r3',
          where: {
            relProp3: 3,
          },
        },
        {
          identifier: 'a3',
          model: ModelB,
          where: {
            name: 'Neogma',
          },
        },
        {
          direction: 'out',
          name: 'RelationshipName4',
          identifier: 'r4',
          where: {
            relProp4: 4,
          },
        },
        {
          identifier: 'a4',
        },
        {
          ...ModelB.getRelationshipByAlias('ModelA'),
        },
        {
          model: ModelA,
        },
        {
          // only min hops
          direction: 'out',
          minHops: 2,
        },
        {
          model: ModelB,
        },
        {
          // infinity hops
          direction: 'in',
          maxHops: Infinity,
        },
        {
          model: ModelA,
        },
        {
          // both min and max hops
          direction: 'none',
          minHops: 2,
          maxHops: 5,
        },
        {
          model: ModelB,
        },
        {
          // only max hops
          direction: 'none',
          maxHops: 5,
        },
        {
          model: ModelA,
        },
      ],
    });

    expectStatementEquals(
      queryBuilder,
      'MATCH (a1)<-[]-(:MyLabelA1)-[:RelationshipName1]->(a2:MyLabelA2)-[r1]-(:`ModelA`)<-[{ relProp1: $relProp1, someLiteral: "exact literal" }]-()-[r2:RelationshipName2]->({ id: $id })<-[:RelationshipName3 { relProp2: $relProp2 }]-(a3 { age: $age })-[r3 { relProp3: $relProp3 }]-(a3:`ModelB` { name: $name })-[r4:RelationshipName4 { relProp4: $relProp4 }]->(a4)-[:RELNAME]->(:`ModelA`)-[*2..]->(:`ModelB`)<-[*]-(:`ModelA`)-[*2..5]-(:`ModelB`)-[*..5]-(:`ModelA`)',
    );
    expectBindParamEquals(queryBuilder, {
      relProp1: 1,
      id: '20',
      relProp2: 2,
      age: 26,
      relProp3: 3,
      name: 'Neogma',
      relProp4: 4,
    });
  });

  describe('type safety', () => {
    it('accepts valid match string parameter', () => {
      const qb = new QueryBuilder();
      qb.match('(n:Node)');
      expect(qb.getStatement()).toContain('MATCH');
    });

    it('accepts valid match object with identifier', () => {
      const qb = new QueryBuilder();
      qb.match({ identifier: 'n' });
      expect(qb.getStatement()).toContain('MATCH (n)');
    });

    it('accepts valid match object with label', () => {
      const qb = new QueryBuilder();
      qb.match({ label: 'MyLabel' });
      expect(qb.getStatement()).toContain('MATCH (:MyLabel)');
    });

    it('rejects invalid match parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - match requires string or match object, not number
        qb.match(123);
      }).toThrow("Invalid 'match' value");
    });

    it('rejects match object with invalid property types', () => {
      const _typeCheck = () => {
        const qb = new QueryBuilder();
        // @ts-expect-error - identifier must be string, not number
        qb.match({ identifier: 123 });
      };
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('database integration', () => {
    const testLabel = 'VariableLengthTest';

    beforeAll(async () => {
      // Create test data: A chain of nodes A->B->C->D
      await neogma.queryRunner.run(
        `CREATE (a:${testLabel} {name: 'A'})
         CREATE (b:${testLabel} {name: 'B'})
         CREATE (c:${testLabel} {name: 'C'})
         CREATE (d:${testLabel} {name: 'D'})
         CREATE (a)-[:CONNECTS]->(b)
         CREATE (b)-[:CONNECTS]->(c)
         CREATE (c)-[:CONNECTS]->(d)`,
      );
    });

    afterAll(async () => {
      // Clean up test data
      await neogma.queryRunner.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
    });

    it('executes variable length relationship query with minHops', async () => {
      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            { identifier: 'a', label: testLabel, where: { name: 'A' } },
            { direction: 'out', name: 'CONNECTS', minHops: 2 },
            { identifier: 'target', label: testLabel },
          ],
        })
        .return('target.name AS name');

      const result = await queryBuilder.run(neogma.queryRunner);
      const names = result.records.map((r) => r.get('name'));

      // minHops: 2 means at least 2 hops, so should get C (2 hops) and D (3 hops)
      expect(names).toContain('C');
      expect(names).toContain('D');
      expect(names).not.toContain('B'); // Only 1 hop away
    });

    it('executes variable length relationship query with maxHops', async () => {
      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            { identifier: 'a', label: testLabel, where: { name: 'A' } },
            { direction: 'out', name: 'CONNECTS', maxHops: 2 },
            { identifier: 'target', label: testLabel },
          ],
        })
        .return('target.name AS name');

      const result = await queryBuilder.run(neogma.queryRunner);
      const names = result.records.map((r) => r.get('name'));

      // maxHops: 2 means at most 2 hops, so should get B (1 hop) and C (2 hops)
      expect(names).toContain('B');
      expect(names).toContain('C');
      expect(names).not.toContain('D'); // 3 hops away
    });

    it('executes variable length relationship query with both minHops and maxHops', async () => {
      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            { identifier: 'a', label: testLabel, where: { name: 'A' } },
            { direction: 'out', name: 'CONNECTS', minHops: 2, maxHops: 2 },
            { identifier: 'target', label: testLabel },
          ],
        })
        .return('target.name AS name');

      const result = await queryBuilder.run(neogma.queryRunner);
      const names = result.records.map((r) => r.get('name'));

      // Exactly 2 hops, should only get C
      expect(names).toEqual(['C']);
    });

    it('executes variable length relationship query with Infinity maxHops', async () => {
      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            { identifier: 'a', label: testLabel, where: { name: 'A' } },
            { direction: 'out', name: 'CONNECTS', maxHops: Infinity },
            { identifier: 'target', label: testLabel },
          ],
        })
        .return('target.name AS name');

      const result = await queryBuilder.run(neogma.queryRunner);
      const names = result.records.map((r) => r.get('name'));

      // Infinity means all reachable nodes: B, C, D
      expect(names).toContain('B');
      expect(names).toContain('C');
      expect(names).toContain('D');
    });
  });

  describe('non-eq operators in match where', () => {
    describe('single node with non-eq operators', () => {
      it('supports Op.gt operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { age: { [Op.gt]: 18 } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.age > $age',
        );
        expectBindParamEquals(queryBuilder, { age: 18 });
      });

      it('supports Op.gte operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { age: { [Op.gte]: 18 } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.age >= $age',
        );
        expectBindParamEquals(queryBuilder, { age: 18 });
      });

      it('supports Op.lt operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { age: { [Op.lt]: 65 } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.age < $age',
        );
        expectBindParamEquals(queryBuilder, { age: 65 });
      });

      it('supports Op.lte operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { age: { [Op.lte]: 65 } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.age <= $age',
        );
        expectBindParamEquals(queryBuilder, { age: 65 });
      });

      it('supports Op.ne operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { status: { [Op.ne]: 'deleted' } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.status <> $status',
        );
        expectBindParamEquals(queryBuilder, { status: 'deleted' });
      });

      it('supports Op.in operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { status: { [Op.in]: ['active', 'pending'] } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.status IN $status',
        );
        expectBindParamEquals(queryBuilder, { status: ['active', 'pending'] });
      });

      it('supports Op._in (reverse in) operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { tags: { [Op._in]: 'important' } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE $tags IN n.tags',
        );
        expectBindParamEquals(queryBuilder, { tags: 'important' });
      });

      it('supports Op.contains operator', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { name: { [Op.contains]: 'foo' } },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node) WHERE n.name CONTAINS $name',
        );
        expectBindParamEquals(queryBuilder, { name: 'foo' });
      });
    });

    describe('combined eq and non-eq operators', () => {
      it('splits eq to bracket syntax and non-eq to WHERE', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'User',
          where: {
            name: 'John',
            age: { [Op.gte]: 18 },
          },
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (n:User { name: $name }) WHERE n.age >= $age',
        );
        expectBindParamEquals(queryBuilder, { name: 'John', age: 18 });
      });

      it('handles multiple eq and non-eq properties', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'u',
          label: 'User',
          where: {
            name: 'John',
            status: 'active',
            age: { [Op.gte]: 18 },
            score: { [Op.gt]: 100 },
          },
        });

        const statement = queryBuilder.getStatement();
        // eq properties go to bracket syntax
        expect(statement).toContain('{ name: $name, status: $status }');
        // non-eq properties go to WHERE
        expect(statement).toContain('WHERE');
        expect(statement).toContain('u.age >= $age');
        expect(statement).toContain('u.score > $score');
      });

      it('handles multiple non-eq operators on same property', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'User',
          where: {
            age: { [Op.gte]: 18, [Op.lte]: 65 },
          },
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toContain('MATCH (n:User) WHERE');
        expect(statement).toContain('n.age >= $age');
        expect(statement).toContain('n.age <= $age__aaaa');
      });
    });

    describe('related nodes with non-eq operators', () => {
      it('supports non-eq operators on first node', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            {
              identifier: 'u',
              label: 'User',
              where: { age: { [Op.gte]: 18 } },
            },
            { direction: 'out', name: 'FOLLOWS' },
            { identifier: 'p', label: 'Post' },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User)-[:FOLLOWS]->(p:Post) WHERE u.age >= $age',
        );
        expectBindParamEquals(queryBuilder, { age: 18 });
      });

      it('supports non-eq operators on second node', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            { identifier: 'u', label: 'User' },
            { direction: 'out', name: 'WROTE' },
            {
              identifier: 'p',
              label: 'Post',
              where: { views: { [Op.gt]: 100 } },
            },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User)-[:WROTE]->(p:Post) WHERE p.views > $views',
        );
        expectBindParamEquals(queryBuilder, { views: 100 });
      });

      it('supports non-eq operators on multiple nodes', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            {
              identifier: 'u',
              label: 'User',
              where: { age: { [Op.gte]: 18 } },
            },
            { direction: 'out', name: 'WROTE' },
            {
              identifier: 'p',
              label: 'Post',
              where: { views: { [Op.gt]: 100 } },
            },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User)-[:WROTE]->(p:Post) WHERE u.age >= $age AND p.views > $views',
        );
        expectBindParamEquals(queryBuilder, { age: 18, views: 100 });
      });

      it('supports combined eq and non-eq on nodes in related', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            {
              identifier: 'u',
              label: 'User',
              where: { status: 'active', age: { [Op.gte]: 18 } },
            },
            { direction: 'out', name: 'FOLLOWS' },
            { identifier: 'p', label: 'Post' },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User { status: $status })-[:FOLLOWS]->(p:Post) WHERE u.age >= $age',
        );
        expectBindParamEquals(queryBuilder, { status: 'active', age: 18 });
      });
    });

    describe('relationships with non-eq operators', () => {
      it('supports non-eq operators on relationship where', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            { identifier: 'u', label: 'User' },
            {
              direction: 'out',
              name: 'FOLLOWS',
              identifier: 'r',
              where: { since: { [Op.gte]: 2020 } },
            },
            { identifier: 'p', label: 'Post' },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User)-[r:FOLLOWS]->(p:Post) WHERE r.since >= $since',
        );
        expectBindParamEquals(queryBuilder, { since: 2020 });
      });

      it('supports combined eq and non-eq on relationships', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            { identifier: 'u', label: 'User' },
            {
              direction: 'out',
              name: 'LIKES',
              identifier: 'r',
              where: {
                type: 'super',
                rating: { [Op.gte]: 4 },
              },
            },
            { identifier: 'p', label: 'Post' },
          ],
        });

        expectStatementEquals(
          queryBuilder,
          'MATCH (u:User)-[r:LIKES { type: $type }]->(p:Post) WHERE r.rating >= $rating',
        );
        expectBindParamEquals(queryBuilder, { type: 'super', rating: 4 });
      });

      it('supports non-eq on both nodes and relationships', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            {
              identifier: 'u',
              label: 'User',
              where: { age: { [Op.gte]: 18 } },
            },
            {
              direction: 'out',
              name: 'FOLLOWS',
              identifier: 'r',
              where: { since: { [Op.gte]: 2020 } },
            },
            {
              identifier: 'p',
              label: 'Post',
              where: { views: { [Op.gt]: 100 } },
            },
          ],
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toContain(
          'MATCH (u:User)-[r:FOLLOWS]->(p:Post) WHERE',
        );
        expect(statement).toContain('u.age >= $age');
        expect(statement).toContain('r.since >= $since');
        expect(statement).toContain('p.views > $views');
      });
    });

    describe('multiple nodes with non-eq operators', () => {
      it('supports non-eq operators in multiple match', () => {
        const queryBuilder = new QueryBuilder().match({
          multiple: [
            {
              identifier: 'a',
              label: 'User',
              where: { age: { [Op.gte]: 18 } },
            },
            {
              identifier: 'b',
              label: 'Post',
              where: { views: { [Op.gt]: 100 } },
            },
          ],
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toContain('MATCH (a:User), (b:Post) WHERE');
        expect(statement).toContain('a.age >= $age');
        expect(statement).toContain('b.views > $views');
      });
    });

    describe('auto-generated identifiers', () => {
      it('generates identifier for non-eq operator without identifier on node', () => {
        const queryBuilder = new QueryBuilder().match({
          label: 'Node',
          where: { age: { [Op.gt]: 18 } },
        });

        const statement = queryBuilder.getStatement();
        // Should generate an identifier like __n for the WHERE clause
        expect(statement).toMatch(
          /MATCH \(__n[^:]*:Node\) WHERE __n[^.]*\.age > \$age/,
        );
        expectBindParamEquals(queryBuilder, { age: 18 });
      });

      it('generates identifier for non-eq operator without identifier on relationship', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            { identifier: 'a', label: 'User' },
            {
              direction: 'out',
              name: 'FOLLOWS',
              // No identifier - will be auto-generated
              where: { since: { [Op.gte]: 2020 } },
            },
            { identifier: 'b', label: 'Post' },
          ],
        });

        const statement = queryBuilder.getStatement();
        // Should generate identifier __r for the WHERE clause
        expect(statement).toBe(
          'MATCH (a:User)-[__r:FOLLOWS]->(b:Post) WHERE __r.since >= $since',
        );
        expectBindParamEquals(queryBuilder, { since: 2020 });
      });

      it('generates multiple unique identifiers', () => {
        const queryBuilder = new QueryBuilder().match({
          related: [
            { label: 'User', where: { age: { [Op.gte]: 18 } } },
            { direction: 'out', name: 'FOLLOWS' },
            { label: 'Post', where: { views: { [Op.gt]: 100 } } },
          ],
        });

        const statement = queryBuilder.getStatement();
        // Both nodes get __n as identifier (no conflict in bind params)
        expect(statement).toBe(
          'MATCH (__n:User)-[:FOLLOWS]->(__n:Post) WHERE __n.age >= $age AND __n.views > $views',
        );
      });
    });

    describe('custom BindParam with auto-generated identifiers', () => {
      it('uses custom BindParam for auto-generated node identifier', () => {
        const bindParam = new BindParam();

        const queryBuilder = new QueryBuilder(bindParam).match({
          label: 'Node',
          where: { age: { [Op.gt]: 18 } },
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toBe('MATCH (__n:Node) WHERE __n.age > $age');
        // Both bindParam and queryBuilder.getBindParam() should have the same params
        expect(bindParam.get()).toEqual({ age: 18 });
        expect(queryBuilder.getBindParam().get()).toEqual({ age: 18 });
        expect(queryBuilder.getBindParam()).toBe(bindParam);
      });

      it('uses custom BindParam for auto-generated relationship identifier', () => {
        const bindParam = new BindParam();

        const queryBuilder = new QueryBuilder(bindParam).match({
          related: [
            { identifier: 'a', label: 'User' },
            {
              direction: 'out',
              name: 'FOLLOWS',
              where: { since: { [Op.gte]: 2020 } },
            },
            { identifier: 'b', label: 'Post' },
          ],
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toMatch(
          /MATCH \(a:User\)-\[__r[^:]*:FOLLOWS\]->\(b:Post\) WHERE __r[^.]*\.since >= \$since/,
        );
        expect(bindParam.get()).toEqual({ since: 2020 });
        expect(queryBuilder.getBindParam()).toBe(bindParam);
      });

      it('shares BindParam across multiple queries with unique identifiers', () => {
        const bindParam = new BindParam();

        const queryBuilder1 = new QueryBuilder(bindParam).match({
          label: 'User',
          where: { age: { [Op.gt]: 18 } },
        });

        const queryBuilder2 = new QueryBuilder(bindParam).match({
          label: 'Post',
          where: { views: { [Op.gte]: 100 } },
        });

        const statement1 = queryBuilder1.getStatement();
        const statement2 = queryBuilder2.getStatement();

        // Both should have auto-generated identifiers
        expect(statement1).toBe('MATCH (__n:User) WHERE __n.age > $age');
        expect(statement2).toBe('MATCH (__n:Post) WHERE __n.views >= $views');

        // Shared BindParam should have both params
        expect(bindParam.get()).toEqual({ age: 18, views: 100 });
      });

      it('custom BindParam with mixed eq and non-eq operators', () => {
        const bindParam = new BindParam();

        const queryBuilder = new QueryBuilder(bindParam).match({
          label: 'User',
          where: {
            name: 'John',
            age: { [Op.gte]: 18 },
          },
        });

        const statement = queryBuilder.getStatement();
        // Name should be in bracket syntax, age in WHERE
        expect(statement).toBe(
          'MATCH (__n:User { name: $name }) WHERE __n.age >= $age',
        );
        expect(bindParam.get()).toEqual({ name: 'John', age: 18 });
      });

      it('custom BindParam with related pattern and multiple auto-generated identifiers', () => {
        const bindParam = new BindParam();

        const queryBuilder = new QueryBuilder(bindParam).match({
          related: [
            { label: 'User', where: { age: { [Op.gte]: 18 } } },
            {
              direction: 'out',
              name: 'CREATED',
              where: { at: { [Op.gt]: 2020 } },
            },
            { label: 'Post', where: { views: { [Op.gte]: 100 } } },
          ],
        });

        const statement = queryBuilder.getStatement();
        expect(statement).toContain('WHERE');
        // All params should be in the shared BindParam
        expect(bindParam.get()).toEqual({ age: 18, at: 2020, views: 100 });
      });
    });

    describe('backward compatibility', () => {
      it('existing eq-only queries work unchanged', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { name: 'test', age: 25 },
        });

        // Should use bracket syntax as before
        expectStatementEquals(
          queryBuilder,
          'MATCH (n:Node { name: $name, age: $age })',
        );
        expectBindParamEquals(queryBuilder, { name: 'test', age: 25 });
      });

      it('Op.eq explicit operator still uses bracket syntax', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
          where: { name: { [Op.eq]: 'test' } },
        });

        expectStatementEquals(queryBuilder, 'MATCH (n:Node { name: $name })');
        expectBindParamEquals(queryBuilder, { name: 'test' });
      });

      it('queries without where work unchanged', () => {
        const queryBuilder = new QueryBuilder().match({
          identifier: 'n',
          label: 'Node',
        });

        expectStatementEquals(queryBuilder, 'MATCH (n:Node)');
        expectBindParamEquals(queryBuilder, {});
      });
    });

    describe('type safety', () => {
      it('accepts valid Op operators in match where', () => {
        const qb = new QueryBuilder();
        // These should all compile without error
        qb.match({ identifier: 'n', where: { age: { [Op.gt]: 18 } } });
        qb.match({ identifier: 'n', where: { age: { [Op.gte]: 18 } } });
        qb.match({ identifier: 'n', where: { age: { [Op.lt]: 65 } } });
        qb.match({ identifier: 'n', where: { age: { [Op.lte]: 65 } } });
        qb.match({
          identifier: 'n',
          where: { status: { [Op.ne]: 'deleted' } },
        });
        qb.match({
          identifier: 'n',
          where: { status: { [Op.in]: ['a', 'b'] } },
        });
        qb.match({
          identifier: 'n',
          where: { name: { [Op.contains]: 'foo' } },
        });
        expect(true).toBe(true);
      });
    });

    describe('database integration - non-eq operators', () => {
      const testLabel = 'NonEqOperatorTest';

      beforeAll(async () => {
        await neogma.queryRunner.run(
          `CREATE (a:${testLabel} {name: 'Alice', age: 25})
           CREATE (b:${testLabel} {name: 'Bob', age: 30})
           CREATE (c:${testLabel} {name: 'Charlie', age: 35})
           CREATE (a)-[:KNOWS {since: 2020}]->(b)
           CREATE (b)-[:KNOWS {since: 2021}]->(c)`,
        );
      });

      afterAll(async () => {
        await neogma.queryRunner.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
      });

      it('executes query with Op.gt operator', async () => {
        const queryBuilder = new QueryBuilder()
          .match({
            identifier: 'n',
            label: testLabel,
            where: { age: { [Op.gt]: 28 } },
          })
          .return('n.name AS name');

        const result = await queryBuilder.run(neogma.queryRunner);
        const names = result.records.map((r) => r.get('name'));

        expect(names).toContain('Bob');
        expect(names).toContain('Charlie');
        expect(names).not.toContain('Alice');
      });

      it('executes query with Op.contains operator', async () => {
        const queryBuilder = new QueryBuilder()
          .match({
            identifier: 'n',
            label: testLabel,
            where: { name: { [Op.contains]: 'li' } },
          })
          .return('n.name AS name');

        const result = await queryBuilder.run(neogma.queryRunner);
        const names = result.records.map((r) => r.get('name'));

        expect(names).toContain('Alice');
        expect(names).toContain('Charlie');
        expect(names).not.toContain('Bob');
      });

      it('executes related query with non-eq on relationship', async () => {
        const queryBuilder = new QueryBuilder()
          .match({
            related: [
              { identifier: 'a', label: testLabel },
              {
                direction: 'out',
                name: 'KNOWS',
                identifier: 'r',
                where: { since: { [Op.gte]: 2021 } },
              },
              { identifier: 'b', label: testLabel },
            ],
          })
          .return('a.name AS from, b.name AS to');

        const result = await queryBuilder.run(neogma.queryRunner);

        expect(result.records.length).toBe(1);
        expect(result.records[0].get('from')).toBe('Bob');
        expect(result.records[0].get('to')).toBe('Charlie');
      });

      it('executes query with combined eq and non-eq', async () => {
        const queryBuilder = new QueryBuilder()
          .match({
            identifier: 'n',
            label: testLabel,
            where: {
              name: 'Bob',
              age: { [Op.gte]: 25 },
            },
          })
          .return('n.name AS name');

        const result = await queryBuilder.run(neogma.queryRunner);
        const names = result.records.map((r) => r.get('name'));

        expect(names).toEqual(['Bob']);
      });
    });
  });
});
