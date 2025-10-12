/* eslint-disable @typescript-eslint/no-unused-vars */

import { randomUUID as uuid } from 'crypto';
import * as dotenv from 'dotenv';
import { neo4jDriver, NeogmaModel } from '../index';
import { Neogma } from '../Neogma';
import { Op, QueryBuilder } from '../Queries';
import { QueryRunner, UpdateOp } from '../Queries/QueryRunner';
import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from './ModelOps';

const { getResultProperties } = QueryRunner;

let neogma: Neogma;

beforeAll(async () => {
  dotenv.config();
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });

  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await neogma.driver.close();
});

type OrderAttributesI = {
  name: string;
  id: string;
};
interface OrdersRelatedNodesI {}

interface OrdersMethodsI {}

interface OrdersStaticsI {}

type OrdersInstance = NeogmaInstance<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI
>;

let Orders: NeogmaModel<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI,
  OrdersStaticsI
>;

type UserAttributesI = {
  name: string;
  age?: number;
  id: string;
};

interface UsersRelatedNodesI {
  Orders: ModelRelatedNodesI<
    typeof Orders,
    OrdersInstance,
    {
      Rating: number;
    },
    {
      rating: number;
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

let Users: NeogmaModel<
  UserAttributesI,
  UsersRelatedNodesI,
  UsersMethodsI,
  UsersStaticsI
>;

describe('ModelFactory', () => {
  it('defines a simple Model', () => {
    Orders = ModelFactory<
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
    Users = ModelFactory<
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  required: true,
                },
              },
            },
          },
        },
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

  it('defines prototype methods', () => {
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    interface OrdersMethodsI {
      foo: () => string;
    }

    const Orders = ModelFactory<
      OrderAttributesI,
      object,
      object,
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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    Orders.prototype.foo = () => 'bar';

    const order = Orders.build({
      id: uuid(),
      name: uuid(),
    });

    expect(order.foo()).toBe('bar');

    expect(Orders).toBeTruthy();
  });
});

describe('createOne', () => {
  it('creates a simple node of a simple Model', async () => {
    type OrderAttributesI = {
      name: string;
      id: string;
      optionalWillBeSet?: string;
      optionalWillNotBeSet?: string;
    };

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

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: 'My Order',
      optionalWillBeSet: 'set',
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
    const existingOrderData: OrderAttributesI = {
      id: uuid(),
      name: 'My Order 1',
    };
    const existingOrder = await Orders.createOne(existingOrderData);

    const userData: UserAttributesI = {
      id: uuid(),
      name: 'My User',
      age: 10,
    };
    const orderToAssociateData: OrderAttributesI = {
      id: uuid(),
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

  it('creates nodes of a Model which is associated with itself', async () => {
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    interface OrdersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Orders)['createOne'] },
        OrdersInstance,
        {
          Rating: number;
        },
        {
          rating: number;
        }
      >;
    }

    type OrdersInstance = NeogmaInstance<OrderAttributesI, OrdersRelatedNodesI>;

    const Orders = ModelFactory<OrderAttributesI, OrdersRelatedNodesI>(
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
        relationships: {
          Parent: {
            direction: 'out',
            model: 'self',
            name: 'HAS',
            properties: {
              Rating: {
                property: 'rating',
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

    expect(Orders).toBeTruthy();

    const childOrderData: OrderAttributesI = {
      id: uuid(),
      name: 'Child Order',
    };

    const parentOrderData: OrderAttributesI = {
      id: uuid(),
      name: 'Parent Order',
    };

    await Orders.createOne({
      ...childOrderData,
      Parent: {
        properties: [{ ...parentOrderData, Rating: 1 }],
      },
    });

    const childOrderInDbResult = await neogma.queryRunner.run(
      `MATCH (n:Order {id: $id}) RETURN n`,
      { id: childOrderData.id },
    );
    const childOrderInDbData = getResultProperties<typeof childOrderData>(
      childOrderInDbResult,
      'n',
    )[0];
    expect(childOrderInDbData).toBeTruthy();
    expect(childOrderInDbData.id).toEqual(childOrderData.id);
    expect(childOrderInDbData.name).toEqual(childOrderData.name);

    const parentOrderInDbResult = await neogma.queryRunner.run(
      `MATCH (n:Order {id: $id}) RETURN n`,
      { id: parentOrderData.id },
    );
    const parentOrderInDbData = getResultProperties<typeof parentOrderData>(
      parentOrderInDbResult,
      'n',
    )[0];
    expect(parentOrderInDbData).toBeTruthy();
    expect(parentOrderInDbData.id).toEqual(parentOrderData.id);
    expect(parentOrderInDbData.name).toEqual(parentOrderData.name);

    const relationshipFromExistingResult = await neogma.queryRunner.run(
      `MATCH (o:Order {id: $childOrderId})-[r:HAS]->(u:Order {id: $parentOrderId}) RETURN r`,
      {
        childOrderId: childOrderData.id,
        parentOrderId: parentOrderData.id,
      },
    );
    const relationshipFromExistingData = getResultProperties<{
      rating: number;
    }>(relationshipFromExistingResult, 'r')[0];
    expect(relationshipFromExistingData).toBeTruthy();
    expect(relationshipFromExistingData.rating).toBe(1);
  });
});

describe('createMany', () => {
  it('asserts created relationships by where', async () => {
    type OrderAttributesI = {
      id: string;
    };
    interface OrdersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Orders)['createOne'] },
        OrdersInstance,
        {
          Rating: number;
        }
      >;
    }

    type OrdersInstance = NeogmaInstance<
      OrderAttributesI,
      OrdersRelatedNodesI,
      OrdersMethodsI
    >;

    const Orders = ModelFactory<OrderAttributesI, OrdersRelatedNodesI>(
      {
        label: 'Order',
        schema: {
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Parent: {
            direction: 'out',
            model: 'self',
            name: 'PARENT',
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    const existingOrders = await Orders.createMany([
      {
        id: uuid(),
      },
      {
        id: uuid(),
      },
    ]);

    const withAssociationsCreateManyData: Parameters<
      typeof Orders.createMany
    >[0] = [
      {
        id: uuid(),
        Parent: {
          properties: [
            {
              id: uuid(),
              Parent: {
                where: {
                  params: {
                    id: existingOrders[0].id,
                  },
                },
              },
            },
            {
              id: uuid(),
              Parent: {
                properties: [
                  {
                    id: uuid(),
                  },
                ],
                where: {
                  params: {
                    id: existingOrders[0].id,
                  },
                },
              },
            },
            {
              id: uuid(),
            },
          ],
          where: {
            params: {
              id: existingOrders[1].id,
            },
          },
        },
      },
    ];

    await Orders.createMany(withAssociationsCreateManyData, {
      assertRelationshipsOfWhere: 3,
    });

    await expect(
      Orders.createMany(withAssociationsCreateManyData, {
        assertRelationshipsOfWhere: 4,
      }),
    ).rejects.toBeTruthy();
  });
});

describe('findOne', () => {
  it('finds one', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: 'user1',
    });

    const foundUser = await Users.findOne({
      where: {
        id: user.id,
      },
    });

    expect(foundUser).toBeTruthy();
    expect(foundUser?.id).toEqual(user.id);
    expect(foundUser?.dataValues.id).toEqual(user.dataValues.id);
  });

  it('finds many plain', async () => {
    const userData = {
      id: uuid(),
      name: 'user1',
    };
    const user = await Users.createOne(userData);

    const foundUser = await Users.findOne({
      where: {
        id: user.id,
      },
      plain: true,
    });

    expect(foundUser).toEqual(userData);
    // @ts-expect-error -- dataValues is not defined on plain
    foundUser.dataValues?.id;
  });
});

describe('findMany', () => {
  it('finds many', async () => {
    const user1 = await Users.createOne({
      id: uuid(),
      name: 'user1',
    });

    const user2 = await Users.createOne({
      id: uuid(),
      name: 'user2',
    });

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id],
        },
      },
    });

    expect(users).toHaveLength(2);
    expect(users[0].id).toEqual(user1.id);
    expect(users[1].id).toEqual(user2.id);
    expect(users[0].dataValues.id).toEqual(user1.dataValues.id);
    expect(users[1].dataValues.id).toEqual(user2.dataValues.id);
  });

  it('finds many plain', async () => {
    const user1Data = {
      id: uuid(),
      name: 'user1',
    };
    const user1 = await Users.createOne(user1Data);

    const user2Data = {
      id: uuid(),
      name: 'user2',
    };
    const user2 = await Users.createOne(user2Data);

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id],
        },
      },
      plain: true,
    });

    expect(users).toHaveLength(2);
    expect(users[0]).toEqual(user1Data);
    expect(users[1]).toEqual(user2Data);
    expect(users).toEqual([user1Data, user2Data]);
    // @ts-expect-error -- dataValues is not defined on plain
    users[0].dataValues?.id;
    // @ts-expect-error -- dataValues is not defined on plain
    users[1].dataValues?.id;
  });
});

describe('addRelationships', () => {
  it('adds a relationship after the Model definition', async () => {
    /* Orders */
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    type OrdersRelatedNodesI = object;
    type OrdersMethodsI = object;
    type OrdersStaticsI = object;

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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {
      Orders: ModelRelatedNodesI<
        typeof Orders,
        OrdersInstance,
        {
          Rating: number;
        },
        {
          rating: number;
        }
      >;
      MoreOrders: ModelRelatedNodesI<
        typeof Orders,
        OrdersInstance,
        { More: boolean },
        { more: boolean }
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 0,
                  maximum: 5,
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

    Users.addRelationships({
      MoreOrders: {
        direction: 'in',
        model: Orders,
        name: 'MORE',
        properties: {
          More: {
            property: 'more',
            schema: {
              type: 'boolean',
              required: true,
            },
          },
        },
      },
    });

    // create a user node and associate it with both associations
    const userWithOrdersData: Parameters<(typeof Users)['createOne']>[0] = {
      id: uuid(),
      name: 'User',
      MoreOrders: {
        properties: [
          {
            id: uuid(),
            name: 'More Order',
            More: true,
          },
        ],
      },
      Orders: {
        properties: [
          {
            id: uuid(),
            name: 'Order',
            Rating: 4,
          },
        ],
      },
    };
    await Users.createOne(userWithOrdersData);

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userWithOrdersData.id },
    );
    const userInDbData = getResultProperties<typeof userWithOrdersData>(
      userInDbResult,
      'n',
    )[0];
    expect(userInDbData).toBeTruthy();
    expect(userInDbData.id).toEqual(userWithOrdersData.id);
    expect(userInDbData.name).toEqual(userWithOrdersData.name);

    const orderData = userWithOrdersData.Orders!.properties![0];
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

    const moreOrderData = userWithOrdersData.MoreOrders!.properties![0];
    const moreOrderInDbResult = await neogma.queryRunner.run(
      `MATCH (n:Order {id: $id}) RETURN n`,
      { id: moreOrderData.id },
    );
    const moreOrderInDbData = getResultProperties<typeof moreOrderData>(
      moreOrderInDbResult,
      'n',
    )[0];
    expect(moreOrderInDbData).toBeTruthy();
    expect(moreOrderInDbData.id).toEqual(moreOrderData.id);
    expect(moreOrderInDbData.name).toEqual(moreOrderData.name);

    const userOrderRelationshipResult = await neogma.queryRunner.run(
      `MATCH (o:Order {id: $orderId})<-[r:CREATES]-(u:User {id: $userId}) RETURN r`,
      {
        orderId: orderData.id,
        userId: userWithOrdersData.id,
      },
    );
    const userOrderRelationshipData = getResultProperties<{
      rating: number;
    }>(userOrderRelationshipResult, 'r')[0];
    expect(userOrderRelationshipData).toBeTruthy();
    expect(userOrderRelationshipData.rating).toBe(4);

    const userModeOrderRelationshipResult = await neogma.queryRunner.run(
      `MATCH (o:Order {id: $orderId})-[r:MORE]->(u:User {id: $userId}) RETURN r`,
      {
        orderId: moreOrderData.id,
        userId: userWithOrdersData.id,
      },
    );
    const userModeOrderRelationshipData = getResultProperties<{
      more: boolean;
    }>(userModeOrderRelationshipResult, 'r')[0];
    expect(userModeOrderRelationshipData).toBeTruthy();
    expect(userModeOrderRelationshipData.more).toBe(true);
  });
});

describe('build', () => {
  it('builds an instance from an existing node', async () => {
    const userId = uuid();

    await Users.createOne({
      id: userId,
      name: 'will be changed',
    });

    const existingUserInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const existingUserInDbData = getResultProperties<UserAttributesI>(
      existingUserInDbResult,
      'n',
    )[0];

    const userInstance = Users.build(existingUserInDbData, {
      status: 'existing',
    });

    const userName = uuid();
    userInstance.name = userName;

    await userInstance.save();

    const finalUserInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const finalUsersInDb = getResultProperties<UserAttributesI>(
      finalUserInDbResult,
      'n',
    );

    expect(finalUsersInDb.length).toBe(1);

    const finalUserInDbData = finalUsersInDb[0];

    expect(finalUserInDbData.name).toBe(userName);
  });
});

describe('buildFromRecord', () => {
  it('builds an instance from a query result record', async () => {
    const orderData: OrderAttributesI = {
      id: uuid(),
      name: uuid(),
    };

    await Orders.createOne(orderData);

    const existingOrderInDbResult = await new QueryBuilder()
      .match({
        model: Orders,
        identifier: 'n',
        where: {
          id: orderData.id,
        },
      })
      .return('n')
      .run();

    const orderInstance = Orders.buildFromRecord(
      existingOrderInDbResult.records[0].get('n'),
    );

    expect(orderInstance.getDataValues()).toEqual(orderData);
    expect(orderInstance.labels.sort()).toEqual(Orders.getRawLabels().sort());
  });
});

describe('save', () => {
  it('throws an error if update fails', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    await user.save();

    // change the id of the user, so saving should fail
    user.id = uuid();

    await expect(user.save()).rejects.toThrow();
  });

  it('does not save if there are no changes', async () => {
    const userId = uuid();

    await Users.createOne({
      id: userId,
      name: 'User',
    });

    const existingUserInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const existingUserInDbData = getResultProperties<UserAttributesI>(
      existingUserInDbResult,
      'n',
    )[0];

    const userInstance = Users.build(existingUserInDbData, {
      status: 'existing',
    });

    await userInstance.save();
  });
});

describe('updateOpRemove', () => {
  it('removes a property from an existing node', async () => {
    const id = uuid();

    const user = await Users.createOne({
      id: id,
      name: 'User',
      age: 10,
    });

    expect(user.age).toBe(10);

    await Users.update(
      {
        age: { [UpdateOp.remove]: true },
      },
      {
        where: {
          id: id,
        },
      },
    );

    const updatedUser = await Users.findOne({
      where: {
        id: id,
      },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser?.age).toBeUndefined();
  });
});

describe('beforeCreate', () => {
  it('mutates data on save', async () => {
    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {}

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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    Users.beforeCreate = (user) => {
      if (!user.age) {
        user.age = 18;
      }
    };

    const userId = uuid();

    const user = Users.build({
      id: userId,
      name: 'User' + Math.random(),
    });

    await user.save();

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userId },
    );

    const userInDbData = getResultProperties<UserAttributesI>(
      userInDbResult,
      'n',
    )[0];

    expect(userInDbData.age).toBe(18);
  });

  it('mutates data before related nodes are created', async () => {
    /* Orders */
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    type OrdersRelatedNodesI = object;
    type OrdersMethodsI = object;
    type OrdersStaticsI = object;

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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {
      Orders: ModelRelatedNodesI<
        typeof Orders,
        OrdersInstance,
        {
          Rating: number;
        },
        {
          rating: number;
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 0,
                  maximum: 5,
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

    const orderId = uuid();
    const userId = uuid();
    const orderName = 'Order' + Math.random();

    Users.beforeCreate = (user) => {
      user.age = (user.age || 0) + 2;
    };

    Orders.beforeCreate = (order) => {
      order.name = orderName;
    };

    await Users.createMany([
      {
        id: userId,
        name: 'User' + Math.random(),
        // after beforeCreate, it should be positive and the validation should succeed
        age: -1,
        Orders: {
          properties: [
            {
              id: orderId,
              name: 'to be changed',
              Rating: 5,
            },
          ],
        },
      },
    ]);

    const userInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const userInDbData = getResultProperties<UserAttributesI>(
      userInDbResult,
      'n',
    )[0];

    expect(userInDbData.age).toBe(1);

    const orderInDbResult = await new QueryBuilder()
      .match({
        model: Orders,
        identifier: 'n',
        where: {
          id: orderId,
        },
      })
      .return('n')
      .run();

    const orderInDbData = getResultProperties<OrderAttributesI>(
      orderInDbResult,
      'n',
    )[0];

    expect(orderInDbData.name).toBe(orderName);
  });
});

describe('beforeDelete', () => {
  it('runs before a node is deleted', async () => {
    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {}

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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    let beforeDeleteUserId = '';

    Users.beforeDelete = (user) => {
      beforeDeleteUserId = user.id;
    };

    const userId = uuid();

    const user = Users.build({
      id: userId,
      name: 'User' + Math.random(),
    });

    await user.save();

    await user.delete();

    expect(beforeDeleteUserId).toBe(userId);
  });
});

describe('relateTo', () => {
  it('relates two nodes of different models without relationship properties', async () => {
    /* Orders */
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    type OrdersRelatedNodesI = object;
    type OrdersMethodsI = object;
    type OrdersStaticsI = object;

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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {
      Orders: ModelRelatedNodesI<typeof Orders, OrdersInstance>;
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order.id,
      },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          {
            model: Users,
            where: { id: user.id },
          },
          {
            ...Users.getRelationshipByAlias('Orders'),
            identifier: 'rel',
          },
          {
            model: Orders,
            where: { id: order.id },
          },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<
      UsersRelatedNodesI['Orders']['RelationshipProperties']
    >(queryRes, 'rel')[0];

    expect(relationshipData).toBeTruthy();
  });

  it('relates two nodes of the same model (self)', async () => {
    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Users)['createOne'] },
        UsersInstance,
        {
          Rating?: number;
        },
        {
          rating?: number;
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Parent: {
            model: 'self',
            direction: 'out',
            name: 'PARENT',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  required: false,
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

    const parent = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const child = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    await child.relateTo({
      alias: 'Parent',
      where: {
        id: parent.id,
      },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          {
            model: Users,
            where: { id: child.id },
          },
          {
            ...Users.getRelationshipByAlias('Parent'),
            identifier: 'rel',
          },
          {
            model: Users,
            where: { id: parent.id },
          },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<
      UsersRelatedNodesI['Parent']['RelationshipProperties']
    >(queryRes, 'rel')[0];

    expect(relationshipData).toBeTruthy();
  });

  it('relates two nodes with relationship properties', async () => {
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
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 0,
                  maximum: 5,
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

    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order.id,
      },
      properties: {
        Rating: 3,
      },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          {
            model: Users,
            where: { id: user.id },
          },
          {
            ...Users.getRelationshipByAlias('Orders'),
            identifier: 'rel',
          },
          {
            model: Orders,
            where: { id: order.id },
          },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<
      UsersRelatedNodesI['Orders']['RelationshipProperties']
    >(queryRes, 'rel')[0];

    expect(relationshipData.rating).toBe(3);
  });

  it('throws if property validation fails', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    await expect(
      user.relateTo({
        alias: 'Orders',
        where: {
          id: order.id,
        },
        properties: {
          Rating: -1,
        },
      }),
    ).rejects.toThrow();

    await expect(
      user.relateTo({
        alias: 'Orders',
        where: {
          id: order.id,
        },
        properties: {
          // @ts-expect-error this is the actual database property, but the alias should be used
          rating: 5,
        },
      }),
    ).rejects.toThrow();
  });
});

describe('findRelationships', () => {
  it('method: gets all the relationships of an instance', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order1 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    const relationship1Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 3,
      };
    const order2 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });
    const relationship2Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 5,
      };

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order1.id,
      },
      properties: {
        Rating: relationship1Properties.rating,
      },
    });
    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order2.id,
      },
      properties: {
        Rating: relationship2Properties.rating,
      },
    });

    const relationships = await user.findRelationships<'Orders'>({
      alias: 'Orders',
    });

    const relationship1 = relationships.find((v) => v.target.id === order1.id);
    const relationship2 = relationships.find((v) => v.target.id === order2.id);

    expect(relationship1).toBeTruthy();
    expect(relationship2).toBeTruthy();

    expect(relationship1?.source.getDataValues()).toEqual(user.getDataValues());
    expect(relationship1?.target.getDataValues()).toEqual(
      order1.getDataValues(),
    );
    expect(relationship1?.relationship.rating).toEqual(
      relationship1Properties.rating,
    );

    expect(relationship2?.source.getDataValues()).toEqual(user.getDataValues());
    expect(relationship2?.target.getDataValues()).toEqual(
      order2.getDataValues(),
    );
    expect(relationship2?.relationship.rating).toEqual(
      relationship2Properties.rating,
    );
  });

  it('method: the relationships of an instance with a limit', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order1 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    const relationship1Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 3,
      };
    const order2 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });
    const relationship2Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 5,
      };

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order1.id,
      },
      properties: {
        Rating: relationship1Properties.rating,
      },
    });
    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order2.id,
      },
      properties: {
        Rating: relationship2Properties.rating,
      },
    });

    const relationships = await user.findRelationships<'Orders'>({
      alias: 'Orders',
      limit: 1,
    });

    expect(relationships.length).toBe(1);

    const relationship = relationships[0];

    expect(relationship).toBeTruthy();
  });

  it('static: gets all the relationships via where params', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order1 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    const relationship1Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 3,
      };
    const order2 = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });
    const relationship2Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 5,
      };

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order1.id,
      },
      properties: {
        Rating: relationship1Properties.rating,
      },
    });
    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order2.id,
      },
      properties: {
        Rating: relationship2Properties.rating,
      },
    });

    const relationships = await Users.findRelationships<'Orders'>({
      alias: 'Orders',
      where: {
        source: {
          id: user.id,
        },
      },
    });

    const relationship1 = relationships.find((v) => v.target.id === order1.id);
    const relationship2 = relationships.find((v) => v.target.id === order2.id);

    expect(relationship1).toBeTruthy();
    expect(relationship2).toBeTruthy();

    expect(relationship1?.source.getDataValues()).toEqual(user.getDataValues());
    expect(relationship1?.target.getDataValues()).toEqual(
      order1.getDataValues(),
    );
    expect(relationship1?.relationship.rating).toEqual(
      relationship1Properties.rating,
    );

    expect(relationship2?.source.getDataValues()).toEqual(user.getDataValues());
    expect(relationship2?.target.getDataValues()).toEqual(
      order2.getDataValues(),
    );
    expect(relationship2?.relationship.rating).toEqual(
      relationship2Properties.rating,
    );
  });
});

describe('deleteRelationships', () => {
  it('method: gets all the relationships of an instance', async () => {
    const user = await Users.createOne({
      id: uuid(),
      name: uuid(),
    });

    const order = await Orders.createOne({
      id: uuid(),
      name: uuid(),
    });

    const relationshipProperties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      {
        rating: 3,
      };

    await user.relateTo({
      alias: 'Orders',
      where: {
        id: order.id,
      },
      properties: {
        Rating: relationshipProperties.rating,
      },
    });

    const deletedCount = await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: {
          id: user.id,
        },
        target: {
          id: order.id,
        },
      },
    });

    expect(deletedCount).toBe(1);
  });
});

describe('Neo4jSupportedTypes', () => {
  const expectNeo4jTypes = {
    point: (
      withNumber: neo4jDriver.Point<number>,
      withInteger: neo4jDriver.Point<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.srid).toEqual(withInteger.srid.low);
      expect(withNumber.x).toEqual(withInteger.x);
      expect(withNumber.y).toEqual(withInteger.y);
      expect(withNumber.z).toEqual(withInteger.z);
    },
    date: (
      withNumber: neo4jDriver.Date<number>,
      withInteger: neo4jDriver.Date<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
    },
    localTime: (
      withNumber: neo4jDriver.LocalTime<number>,
      withInteger: neo4jDriver.LocalTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
    },
    dateTime: (
      withNumber: neo4jDriver.DateTime<number>,
      withInteger: neo4jDriver.DateTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
      expect(withNumber.timeZoneOffsetSeconds).toEqual(
        withInteger.timeZoneOffsetSeconds?.low,
      );
      expect(withNumber.timeZoneId).toEqual(withInteger.timeZoneId);
    },
    localDateTime: (
      withNumber: neo4jDriver.LocalDateTime<number>,
      withInteger: neo4jDriver.LocalDateTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
    },
    duration: (
      withNumber: neo4jDriver.Duration<any>,
      withInteger: neo4jDriver.Duration<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.months).toEqual(withInteger.months.low);
      expect(withNumber.days).toEqual(withInteger.days.low);
      expect(withNumber.seconds.low).toEqual(withInteger.seconds.low);
      expect(withNumber.nanoseconds.low).toEqual(withInteger.nanoseconds.low);
    },
  };

  it('creates a node with every supported neo4j type', async () => {
    type UserAttributesI = {
      id: string;
      number: number;
      integer: neo4jDriver.Integer;
      string: string;
      boolean: boolean;
      point: neo4jDriver.Point<any>;
      date: neo4jDriver.Date<any>;
      time: neo4jDriver.Time<any>;
      localTime: neo4jDriver.LocalTime<any>;
      dateTime: neo4jDriver.DateTime<any>;
      localDateTime: neo4jDriver.LocalDateTime<any>;
      duration: neo4jDriver.Duration<any>;
      numberArr: number[];
      integerArr: neo4jDriver.Integer[];
      stringArr: string[];
      booleanArr: boolean[];
      pointArr: Array<neo4jDriver.Point<any>>;
      dateArr: Array<neo4jDriver.Date<any>>;
      timeArr: Array<neo4jDriver.Time<any>>;
      localTimeArr: Array<neo4jDriver.LocalTime<any>>;
      dateTimeArr: Array<neo4jDriver.DateTime<any>>;
      localDateTimeArr: Array<neo4jDriver.LocalDateTime<any>>;
      durationArr: Array<neo4jDriver.Duration<any>>;
    };
    interface UsersRelatedNodesI {}

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
          id: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          number: {
            type: 'number',
            required: true,
          },
          integer: {
            type: 'any',
            conform: (v) => neo4jDriver.isInt(v),
            required: true,
          },
          string: {
            type: 'string',
            minLength: 1,
            required: true,
          },
          boolean: {
            type: 'boolean',
            required: true,
          },
          point: {
            type: 'any',
            conform: (v) => neo4jDriver.isPoint(v),
            required: true,
          },
          date: {
            type: 'any',
            conform: (v) => neo4jDriver.isDate(v),
            required: true,
          },
          localTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isLocalTime(v),
            required: true,
          },
          dateTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isDateTime(v),
            required: true,
          },
          localDateTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isLocalDateTime(v),
            required: true,
          },
          time: {
            type: 'any',
            conform: (v) => neo4jDriver.isTime(v),
            required: true,
          },
          duration: {
            type: 'any',
            conform: (v) => neo4jDriver.isDuration(v),
            required: true,
          },
          numberArr: {
            type: 'array',
            required: true,
            items: {
              type: 'number',
              required: true,
            },
          },
          integerArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isInt(v),
              required: true,
            },
          },
          stringArr: {
            type: 'array',
            required: true,
            items: {
              type: 'string',
              minLength: 1,
              required: true,
            },
          },
          booleanArr: {
            type: 'array',
            required: true,
            items: {
              type: 'boolean',
              required: true,
            },
          },
          pointArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isPoint(v),
              required: true,
            },
          },
          dateArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDate(v),
              required: true,
            },
          },
          timeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isTime(v),
              required: true,
            },
          },
          localTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isLocalTime(v),
              required: true,
            },
          },
          dateTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDateTime(v),
              required: true,
            },
          },
          localDateTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isLocalDateTime(v),
              required: true,
            },
          },
          durationArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDuration(v),
              required: true,
            },
          },
        },
        relationships: [],
        statics: {},
        methods: {},
      },
      neogma,
    );

    const userData: UserAttributesI = {
      id: uuid(),
      number: 25,
      integer: new neo4jDriver.types.Integer(10, 10),
      string: 'John',
      boolean: true,
      point: new neo4jDriver.types.Point(4326, 1, 1),
      date: neo4jDriver.types.Date.fromStandardDate(new Date()),
      time: new neo4jDriver.types.Time(6, 4, 3, 2, 1),
      localTime: neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
      dateTime: neo4jDriver.types.DateTime.fromStandardDate(new Date()),
      localDateTime: neo4jDriver.types.LocalDateTime.fromStandardDate(
        new Date(),
      ),
      duration: new neo4jDriver.types.Duration(5, 4, 3, 2),
      numberArr: [35, 42],
      integerArr: [
        new neo4jDriver.types.Integer(11, 11),
        new neo4jDriver.types.Integer(12, 12),
      ],
      stringArr: ['Bob', 'Jack'],
      booleanArr: [true, false],
      pointArr: [
        new neo4jDriver.types.Point(4326, 1.1, 1.1),
        new neo4jDriver.types.Point(4326, 1.2, 1.2),
      ],
      dateArr: [
        neo4jDriver.types.Date.fromStandardDate(new Date()),
        neo4jDriver.types.Date.fromStandardDate(new Date()),
      ],
      timeArr: [
        new neo4jDriver.types.Time(6, 4, 3, 2, 1),
        new neo4jDriver.types.Time(7, 6, 5, 4, 3),
      ],
      localTimeArr: [
        neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
        neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
      ],
      dateTimeArr: [
        neo4jDriver.types.DateTime.fromStandardDate(new Date()),
        neo4jDriver.types.DateTime.fromStandardDate(new Date()),
      ],
      localDateTimeArr: [
        neo4jDriver.types.LocalDateTime.fromStandardDate(new Date()),
        neo4jDriver.types.LocalDateTime.fromStandardDate(new Date()),
      ],
      durationArr: [
        new neo4jDriver.types.Duration(1, 2, 3, 4),
        new neo4jDriver.types.Duration(2, 3, 4, 5),
      ],
    };

    await Users.createOne(userData);

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userData.id },
    );

    const userInDbData = getResultProperties<typeof userData>(
      userInDbResult,
      'n',
    )[0];

    expect(userData).toBeTruthy();

    expect(userData.id).toEqual(userInDbData.id);

    expect(userData.number).toEqual(userInDbData.number);

    expect(userData.integer).toEqual(userInDbData.integer);

    expect(userData.string).toEqual(userInDbData.string);

    expect(userData.boolean).toEqual(userInDbData.boolean);

    expectNeo4jTypes.point(userData.point, userInDbData.point);
    userData.pointArr.forEach((point, index) =>
      expectNeo4jTypes.point(point, userInDbData.pointArr[index]),
    );

    expectNeo4jTypes.date(userData.date, userInDbData.date);
    userData.dateArr.forEach((date, index) =>
      expectNeo4jTypes.date(date, userInDbData.dateArr[index]),
    );

    expectNeo4jTypes.localTime(userData.localTime, userInDbData.localTime);
    userData.localTimeArr.forEach((localTime, index) =>
      expectNeo4jTypes.localTime(localTime, userInDbData.localTimeArr[index]),
    );

    expectNeo4jTypes.dateTime(userData.dateTime, userInDbData.dateTime);
    userData.dateTimeArr.forEach((dateTime, index) =>
      expectNeo4jTypes.dateTime(dateTime, userInDbData.dateTimeArr[index]),
    );

    expectNeo4jTypes.localDateTime(
      userData.localDateTime,
      userInDbData.localDateTime,
    );
    userData.localDateTimeArr.forEach((localDateTime, index) =>
      expectNeo4jTypes.localDateTime(
        localDateTime,
        userInDbData.localDateTimeArr[index],
      ),
    );
  });
});
