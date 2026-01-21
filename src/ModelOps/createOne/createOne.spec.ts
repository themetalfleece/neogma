import { randomUUID as uuid } from 'crypto';
import { QueryRunner } from '../../Queries/QueryRunner';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  ModelFactory,
  ModelRelatedNodesI,
  NeogmaInstance,
  OrderAttributesI,
  UserAttributesI,
} from '../testHelpers';

const { getResultProperties } = QueryRunner;

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('createOne', () => {
  it('creates a simple node of a simple Model', async () => {
    const neogma = getNeogma();

    type LocalOrderAttributesI = {
      name: string;
      id: string;
      optionalWillBeSet?: string;
      optionalWillNotBeSet?: string;
    };

    const Orders = ModelFactory<LocalOrderAttributesI, object, object, object>(
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

    const orderData: LocalOrderAttributesI = {
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
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

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
    const neogma = getNeogma();

    type LocalOrderAttributesI = {
      name: string;
      id: string;
    };

    interface LocalOrdersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Orders)['createOne'] },
        LocalOrdersInstance,
        {
          Rating: number;
        },
        {
          rating: number;
        }
      >;
    }

    type LocalOrdersInstance = NeogmaInstance<
      LocalOrderAttributesI,
      LocalOrdersRelatedNodesI
    >;

    const Orders = ModelFactory<
      LocalOrderAttributesI,
      LocalOrdersRelatedNodesI
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

    const childOrderData: LocalOrderAttributesI = {
      id: uuid(),
      name: 'Child Order',
    };

    const parentOrderData: LocalOrderAttributesI = {
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

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('createOne type safety', () => {
  it('returns correctly typed instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: 'Test Order',
    };

    const order = await Orders.createOne(orderData);

    // Type tests: valid property access should compile
    const _id: string = order.id;
    const _name: string = order.name;
    expect(_id).toBe(orderData.id);
    expect(_name).toBe(orderData.name);

    // Instance methods should be available
    const _dataValues = order.getDataValues();
    expect(_dataValues.id).toBe(orderData.id);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void order.nonExistent;
  });
});
