/* eslint-disable @typescript-eslint/no-empty-interface */
import { QueryBuilder } from './QueryBuilder';
import { Neogma } from '../Neogma';
import * as dotenv from 'dotenv';
import { ModelFactory, NeogmaInstance } from '..';

let neogma: Neogma;

beforeAll(async () => {
    dotenv.config();
    neogma = new Neogma({
        url: process.env.NEO4J_URL ?? '',
        username: process.env.NEO4J_USERNAME ?? '',
        password: process.env.NEO4J_PASSWORD ?? '',
    });
});

afterAll(async () => {
    await neogma.driver.close();
});

const getOrdersModel = () => {
    type OrderAttributesI = {
        name: string;
        id: string;
        optionalWillBeSet?: string;
        optionalWillNotBeSet?: string;
    };
    interface OrdersRelatedNodesI {}

    interface OrdersMethodsI {}

    interface OrdersStaticsI {}

    type OrdersInstance = NeogmaInstance<
        OrderAttributesI,
        OrdersRelatedNodesI,
        OrdersMethodsI
    >;

    const Orders = ModelFactory<
        OrderAttributesI,
        OrdersRelatedNodesI,
        OrdersStaticsI,
        OrdersMethodsI
    >(
        {
            label: 'Order',
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
                optionalWillBeSet: {
                    type: 'string',
                    required: false,
                },
                optionalWillNotBeSet: {
                    type: 'string',
                    required: false,
                },
            },
            relationships: [],
            primaryKeyField: 'id',
            statics: {},
            methods: {},
        },
        neogma,
    );

    return Orders;
};

describe.only('QueryBuilder', () => {
    it('Builds a query of every parameters type', () => {
        const Orders = getOrdersModel();

        const queryBuilder = new QueryBuilder([
            {
                match: '(u: User)',
            },
            {
                match: {
                    identifier: 'o',
                    model: Orders,
                    where: {
                        id: '20',
                        age: 26,
                    },
                    optional: true,
                },
            },
            {
                match: {
                    identifier: 'p',
                    label: 'Product',
                    where: {
                        id: '21',
                    },
                },
            },
            {
                set: `o.age = 27`,
            },
            {
                set: {
                    identifier: 'p',
                    properties: {
                        name: 'NewName',
                        isAvailable: false,
                    },
                },
            },
        ]);

        console.log(queryBuilder.getStatement());
        console.log(queryBuilder.getBindParam());
    });
});
