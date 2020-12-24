/* eslint-disable @typescript-eslint/no-empty-interface */
import { QueryBuilder } from './QueryBuilder';
import { Neogma } from '../../Neogma';
import * as dotenv from 'dotenv';
import { ModelFactory, neo4jDriver, NeogmaInstance } from '../..';
import { ModelRelatedNodesI } from '../../ModelOps';

dotenv.config();

const neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
});

afterAll(async () => {
    await neogma.driver.close();
});

// 2 associated models A/B
type ModelAAttributesI = {
    name: string;
    id: string;
};
interface ModelARelatedNodesI {}

interface ModelAMethodsI {}

interface ModelAStaticsI {}

type ModelAInstance = NeogmaInstance<
    ModelAAttributesI,
    ModelARelatedNodesI,
    ModelAMethodsI
>;

const ModelA = ModelFactory<
    ModelAAttributesI,
    ModelARelatedNodesI,
    ModelAStaticsI,
    ModelAMethodsI
>(
    {
        label: 'ModelA',
        schema: {
            name: {
                type: 'string',
                minLength: 3,
                required: true,
            },
            id: {
                type: 'string',
                required: true,
            },
        },
        relationships: [],
        primaryKeyField: 'id',
        statics: {},
        methods: {},
    },
    neogma,
);

type ModelBAttributesI = {
    name: string;
    id: string;
    age: number;
};
interface ModelBRelatedNodesI {
    ModelA: ModelRelatedNodesI<
        typeof ModelA,
        ModelAInstance,
        {
            Available: number;
        }
    >;
}

interface ModelBMethodsI {}

interface ModelBStaticsI {}

type ModelBInstance = NeogmaInstance<
    ModelBAttributesI,
    ModelBRelatedNodesI,
    ModelBMethodsI
>;

const ModelB = ModelFactory<
    ModelBAttributesI,
    ModelBRelatedNodesI,
    ModelBStaticsI,
    ModelBMethodsI
>(
    {
        label: 'ModelB',
        schema: {
            name: {
                type: 'string',
                minLength: 3,
                required: true,
            },
            id: {
                type: 'string',
                required: true,
            },
            age: {
                type: 'number',
                required: true,
            },
        },
        relationships: {
            ModelA: {
                direction: 'out',
                model: ModelA,
                name: 'RELNAME',
                properties: {
                    Available: {
                        property: 'available',
                        schema: {
                            type: 'number',
                            required: true,
                        },
                    },
                },
            },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
    },
    neogma,
);

const expectStatementEquals = (queryBuilder: QueryBuilder, string: string) => {
    expect(queryBuilder.getStatement()).toEqual(string);
};

const expectBindParamEquals = (
    queryBuilder: QueryBuilder,
    target: Record<string, any>,
) => {
    expect(queryBuilder.getBindParam().get()).toEqual(target);
};

describe.only('QueryBuilder', () => {
    // TODO add unit testing for create and merge
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

    describe('raw', () => {
        it('generates a raw statement', () => {
            const rawStatement = 'MATCH (a:A) RETURN a';
            const queryBuilder = new QueryBuilder().raw(rawStatement);

            expectStatementEquals(queryBuilder, rawStatement);
            expectBindParamEquals(queryBuilder, {});
        });
    });

    describe('match', () => {
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

            expectStatementEquals(
                queryBuilder,
                'MATCH (:`ModelA` { id: $id })',
            );
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

            expectStatementEquals(
                queryBuilder,
                'MATCH (a:MyLabel { id: $id })',
            );
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

            expectStatementEquals(
                queryBuilder,
                'MATCH (a:`ModelA` { id: $id })',
            );
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

            expectStatementEquals(
                queryBuilder,
                'MATCH (a:`ModelA` { id: $id }), (b)',
            );
            expectBindParamEquals(queryBuilder, { id: '20' });
        });

        it('generates an match statement by relating models with every relationship combination', () => {
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
                ],
            });

            expectStatementEquals(
                queryBuilder,
                'MATCH (a1)<-[]-(:MyLabelA1)-[:RelationshipName1]->(a2:MyLabelA2)-[r1]-(:`ModelA`)<-[{ relProp1: $relProp1 }]-()-[r2:RelationshipName2]->({ id: $id })<-[:RelationshipName3 { relProp2: $relProp2 }]-(a3 { age: $age })-[r3 { relProp3: $relProp3 }]-(a3:`ModelB` { name: $name })-[r4:RelationshipName4 { relProp4: $relProp4 }]->(a4)-[:RELNAME]->(:`ModelA`)',
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
    });

    describe('where', () => {
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
            });

            expectStatementEquals(
                queryBuilder,
                'WHERE i1.id = $id AND i2.id = $id__aaaa AND i2.name = $name',
            );
            expectBindParamEquals(queryBuilder, {
                id: '20',
                id__aaaa: '21',
                name: 'J',
            });
        });
    });

    describe('set', () => {
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
                },
            });

            expectStatementEquals(
                queryBuilder,
                'SET a.name = $name, a.available = $available',
            );
            expectBindParamEquals(queryBuilder, {
                name: 'K',
                available: 5,
            });
        });
    });

    describe('remove', () => {
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

            expectStatementEquals(queryBuilder, `REMOVE a:l1:l2`);
            expectBindParamEquals(queryBuilder, {});
        });
    });

    describe('delete', () => {
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
    });

    describe('unwind', () => {
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
    });

    describe('with', () => {
        it('generates a with statement by a literal', () => {
            const literal = 'a';
            const queryBuilder = new QueryBuilder().with(literal);

            expectStatementEquals(queryBuilder, `WITH ${literal}`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a with statement by an array', () => {
            const queryBuilder = new QueryBuilder().with(['a', 'b']);

            expectStatementEquals(queryBuilder, `WITH a, b`);
            expectBindParamEquals(queryBuilder, {});
        });
    });

    describe('orderBy', () => {
        it('generates a orderBy statement by a literal', () => {
            const literal = 'a ASC';
            const queryBuilder = new QueryBuilder().orderBy(literal);

            expectStatementEquals(queryBuilder, `ORDER BY ${literal}`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a orderBy statement by an array of literal strings', () => {
            const queryBuilder = new QueryBuilder().orderBy([
                'a',
                'b DESC',
                'c ASC',
            ]);

            expectStatementEquals(queryBuilder, `ORDER BY a, b DESC, c ASC`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates an orderBy statement by an object with identifier', () => {
            const queryBuilder = new QueryBuilder().orderBy({
                identifier: 'a',
            });

            expectStatementEquals(queryBuilder, `ORDER BY a`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates an orderBy statement by an object with identifier and direction', () => {
            const queryBuilder = new QueryBuilder().orderBy({
                identifier: 'a',
                direction: 'DESC',
            });

            expectStatementEquals(queryBuilder, `ORDER BY a DESC`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates an orderBy statement by an object with identifier and property', () => {
            const queryBuilder = new QueryBuilder().orderBy({
                identifier: 'a',
                property: 'p1',
            });

            expectStatementEquals(queryBuilder, `ORDER BY a.p1`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates an orderBy statement by an object with identifier, property and direction', () => {
            const queryBuilder = new QueryBuilder().orderBy({
                identifier: 'a',
                property: 'p1',
                direction: 'ASC',
            });

            expectStatementEquals(queryBuilder, `ORDER BY a.p1 ASC`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates an orderBy statement by an object with an array of every combination', () => {
            const queryBuilder = new QueryBuilder().orderBy([
                'a',
                ['b', 'DESC'],
                {
                    identifier: 'c',
                },
                {
                    identifier: 'd',
                    direction: 'DESC',
                },
                {
                    identifier: 'e',
                    property: 'p1',
                },
                {
                    identifier: 'e',
                    property: 'p1',
                    direction: 'ASC',
                },
            ]);

            expectStatementEquals(
                queryBuilder,
                `ORDER BY a, b DESC, c, d DESC, e.p1, e.p1 ASC`,
            );
            expectBindParamEquals(queryBuilder, {});
        });
    });

    describe('return', () => {
        it('generates a return statement by a literal', () => {
            const literal = 'a, b.p1';
            const queryBuilder = new QueryBuilder().return(literal);

            expectStatementEquals(queryBuilder, `RETURN ${literal}`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a return statement by an array of literals', () => {
            const queryBuilder = new QueryBuilder().return(['a', 'b.p1']);

            expectStatementEquals(queryBuilder, `RETURN a, b.p1`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a return statement by an array of objects of every combination', () => {
            const queryBuilder = new QueryBuilder().return([
                {
                    identifier: 'a',
                },
                {
                    identifier: 'b',
                    property: 'p1',
                },
            ]);

            expectStatementEquals(queryBuilder, `RETURN a, b.p1`);
            expectBindParamEquals(queryBuilder, {});
        });
    });

    describe('limit', () => {
        it('generates a limit statement by a literal', () => {
            const literal = '2';
            const queryBuilder = new QueryBuilder().limit(literal);

            expectStatementEquals(queryBuilder, `LIMIT ${literal}`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a limit statement by a number', () => {
            const literal = 1;
            const queryBuilder = new QueryBuilder().limit(literal);

            expectStatementEquals(queryBuilder, `LIMIT $limit`);
            expectBindParamEquals(queryBuilder, { limit: neo4jDriver.int(1) });
        });
    });

    describe('skip', () => {
        it('generates a skip statement by a literal', () => {
            const literal = '2';
            const queryBuilder = new QueryBuilder().skip(literal);

            expectStatementEquals(queryBuilder, `SKIP ${literal}`);
            expectBindParamEquals(queryBuilder, {});
        });

        it('generates a skip statement by a number', () => {
            const literalNumber = 1;
            const queryBuilder = new QueryBuilder().skip(literalNumber);

            expectStatementEquals(queryBuilder, `SKIP $skip`);
            expectBindParamEquals(queryBuilder, { skip: neo4jDriver.int(1) });
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

        it('adds new params to the query by using a object', () => {
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

            expectStatementEquals(
                queryBuilder,
                'MATCH (a { p1: $p1 }) LIMIT $limit',
            );
            expectBindParamEquals(queryBuilder, {
                p1: 'v1',
                limit: neo4jDriver.int(1),
            });
        });

        it('adds new params to the query by using a many object (rest param)', () => {
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
});
