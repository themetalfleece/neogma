/* eslint-disable @typescript-eslint/no-empty-interface */
import { Neogma } from '../Neogma';
import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from './ModelOps';
import * as dotenv from 'dotenv';
import { getResultProperties } from '../QueryRunner';

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

describe('ModelFactory', () => {
    it('defines a simple Model', () => {
        interface OrderAttributesI {
            name: string;
            id: string;
        }
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
                },
                relationships: [],
                primaryKeyField: 'id',
                statics: {},
                methods: {},
            },
            neogma,
        );

        expect(Orders).toBeTruthy();
    });
    it('defines a 2 associated Models', () => {
        /* Orders */
        interface OrderAttributesI {
            name: string;
            id: string;
        }
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
                },
                relationships: [],
                primaryKeyField: 'id',
                statics: {},
                methods: {},
            },
            neogma,
        );

        /* Users */

        interface UserAttributesI {
            name: string;
            age?: number;
            id: string;
        }

        interface UsersRelatedNodesI {
            Orders: ModelRelatedNodesI<
                typeof Orders,
                OrdersInstance,
                {
                    Rating: number;
                }
            >;
        }

        interface UsersMethodsI {}

        interface UsersStaticsI {
            foo: () => string;
        }

        type UsersInstance = NeogmaInstance<
            UserAttributesI,
            UsersRelatedNodesI,
            UsersMethodsI
        >;

        const Users = ModelFactory<
            UserAttributesI,
            UsersRelatedNodesI,
            UsersStaticsI,
            UsersMethodsI
        >(
            {
                label: 'User',
                schema: {
                    name: {
                        type: 'string',
                        minLength: 3,
                        required: true,
                    },
                    age: {
                        type: 'number',
                        minimum: 0,
                    },
                    id: {
                        type: 'string',
                        required: true,
                    },
                },
                relationships: [
                    {
                        model: Orders,
                        direction: 'out',
                        name: 'CREATES',
                        alias: 'Orders',
                        properties: {
                            Rating: {
                                property: 'rating',
                                schema: {
                                    type: 'number',
                                },
                            },
                        },
                    },
                ],
                primaryKeyField: 'id',
                statics: {
                    foo: () => {
                        return 'foo';
                    },
                },
                methods: {
                    bar() {
                        return 'The name of this user is: ' + this.name;
                    },
                },
            },
            neogma,
        );

        expect(Orders).toBeTruthy();
        expect(Users).toBeTruthy();
    });
});

describe('createOne', () => {
    it('creates a simple node of a simple Model', async () => {
        interface OrderAttributesI {
            name: string;
            id: string;
        }
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
                },
                relationships: [],
                primaryKeyField: 'id',
                statics: {},
                methods: {},
            },
            neogma,
        );

        const orderData: OrderAttributesI = {
            id: Math.random().toString(),
            name: 'My Order',
        };

        const order = await Orders.createOne(orderData);

        expect(order).toBeTruthy();
        expect(order.id).toEqual(orderData.id);
        expect(order.name).toEqual(orderData.name);

        const orderInDbResult = await neogma.queryRunner.run(
            `MATCH (n:Order {id: $id}) RETURN n`,
            { id: orderData.id },
        );

        const orderInDbData = getResultProperties<typeof orderData>(
            orderInDbResult,
            'n',
        )[0];

        expect(orderInDbData).toBeTruthy();
        expect(orderInDbData.id).toEqual(orderData.id);
        expect(orderInDbData.name).toEqual(orderData.name);
    });

    it('creates nodes of a Model and associated nodes and associates by a where condition', async () => {
        /* Orders */
        interface OrderAttributesI {
            name: string;
            id: string;
        }
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
                },
                relationships: [],
                primaryKeyField: 'id',
                statics: {},
                methods: {},
            },
            neogma,
        );

        /* Users */

        interface UserAttributesI {
            name: string;
            age?: number;
            id: string;
        }

        interface UsersRelatedNodesI {
            Orders: ModelRelatedNodesI<
                typeof Orders,
                OrdersInstance,
                {
                    Rating: number;
                }
            >;
        }

        interface UsersMethodsI {}

        interface UsersStaticsI {}

        type UsersInstance = NeogmaInstance<
            UserAttributesI,
            UsersRelatedNodesI,
            UsersMethodsI
        >;

        const Users = ModelFactory<
            UserAttributesI,
            UsersRelatedNodesI,
            UsersStaticsI,
            UsersMethodsI
        >(
            {
                label: 'User',
                schema: {
                    name: {
                        type: 'string',
                        minLength: 3,
                        required: true,
                    },
                    age: {
                        type: 'number',
                        minimum: 0,
                    },
                    id: {
                        type: 'string',
                        required: true,
                    },
                },
                relationships: [
                    {
                        model: Orders,
                        direction: 'out',
                        name: 'CREATES',
                        alias: 'Orders',
                        properties: {
                            Rating: {
                                property: 'rating',
                                schema: {
                                    type: 'number',
                                },
                            },
                        },
                    },
                ],
                primaryKeyField: 'id',
                statics: {},
                methods: {},
            },
            neogma,
        );

        const existingOrderData: OrderAttributesI = {
            id: Math.random().toString(),
            name: 'My Order 1',
        };
        const existingOrder = await Orders.createOne(existingOrderData);

        const userData: UserAttributesI = {
            id: Math.random().toString(),
            name: 'My User',
            age: 10,
        };
        const orderToAssociateData: OrderAttributesI = {
            id: Math.random().toString(),
            name: 'My Order 2',
        };

        const user = await Users.createOne({
            ...userData,
            Orders: {
                properties: [{ ...orderToAssociateData, Rating: 2 }],
                where: {
                    params: {
                        id: existingOrder.id,
                    },
                    relationshipProperties: {
                        Rating: 1,
                    },
                },
            },
        });

        const userInDbResult = await neogma.queryRunner.run(
            `MATCH (n:User {id: $id}) RETURN n`,
            { id: userData.id },
        );
        const userInDbData = getResultProperties<typeof userData>(
            userInDbResult,
            'n',
        )[0];
        expect(userInDbData).toBeTruthy();
        expect(userInDbData.id).toEqual(userData.id);
        expect(userInDbData.name).toEqual(userData.name);
        expect(userInDbData.age).toEqual(userData.age);

        const orderInDbResult = await neogma.queryRunner.run(
            `MATCH (n:Order {id: $id}) RETURN n`,
            { id: orderToAssociateData.id },
        );
        const orderInDbData = getResultProperties<typeof orderToAssociateData>(
            orderInDbResult,
            'n',
        )[0];
        expect(orderInDbData).toBeTruthy();
        expect(orderInDbData.id).toEqual(orderToAssociateData.id);
        expect(orderInDbData.name).toEqual(orderToAssociateData.name);

        const relationshipFromAssociationResult = await neogma.queryRunner.run(
            `MATCH (o:Order {id: $orderId})<-[r:CREATES]-(u:User {id: $userId}) RETURN r`,
            { orderId: orderToAssociateData.id, userId: user.id },
        );
        const relationshipFromAssociationData = getResultProperties<{
            rating: number;
        }>(relationshipFromAssociationResult, 'r')[0];
        expect(relationshipFromAssociationData).toBeTruthy();
        expect(relationshipFromAssociationData.rating).toBe(2);

        const relationshipFromExistingResult = await neogma.queryRunner.run(
            `MATCH (o:Order {id: $orderId})<-[r:CREATES]-(u:User {id: $userId}) RETURN r`,
            { orderId: existingOrder.id, userId: user.id },
        );
        const relationshipFromExistingData = getResultProperties<{
            rating: number;
        }>(relationshipFromExistingResult, 'r')[0];
        expect(relationshipFromExistingData).toBeTruthy();
        expect(relationshipFromExistingData.rating).toBe(1);
    });
});
