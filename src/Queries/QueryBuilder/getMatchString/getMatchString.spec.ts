import { Literal } from '../../Literal';
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
      // @ts-expect-error - match requires string or match object, not number
      void qb.match(123);
    });

    it('rejects match object with invalid property types', () => {
      const qb = new QueryBuilder();
      // @ts-expect-error - identifier must be string, not number
      void qb.match({ identifier: 123 });
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
});
