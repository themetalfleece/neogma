import { randomUUID as uuid } from 'crypto';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  UsersRelatedNodesI,
} from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('findRelationships instance method', () => {
  it('gets all the relationships of an instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const relationship1Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 3 };

    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });
    const relationship2Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 5 };

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: relationship1Properties.rating },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: relationship2Properties.rating },
    });

    const relationships = await user.findRelationships({
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

  it('limits the relationships', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: 3 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: 5 },
    });

    const relationships = await user.findRelationships({
      alias: 'Orders',
      limit: 1,
    });

    expect(relationships.length).toBe(1);
  });

  it('skips relationships', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const order1Name = uuid();
    const order1 = await Orders.createOne({ id: uuid(), name: order1Name });
    const order2Name = uuid();
    const order2 = await Orders.createOne({ id: uuid(), name: order2Name });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: 3 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: 5 },
    });

    const relationships = await user.findRelationships({
      alias: 'Orders',
      skip: 1,
    });

    expect(relationships.length).toBe(1);
    expect(relationships[0].target.name).toBe(order2Name);
  });

  it('orders relationships by target property', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const orderA = await Orders.createOne({ id: uuid(), name: 'A_Order' });
    const orderB = await Orders.createOne({ id: uuid(), name: 'B_Order' });
    const orderC = await Orders.createOne({ id: uuid(), name: 'C_Order' });

    await user.relateTo({
      alias: 'Orders',
      where: { id: orderB.id },
      properties: { Rating: 1 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: orderA.id },
      properties: { Rating: 1 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: orderC.id },
      properties: { Rating: 1 },
    });

    // Test DESC ordering
    const relationshipsDesc = await user.findRelationships({
      alias: 'Orders',
      order: [{ on: 'target', property: 'name', direction: 'DESC' }],
    });

    expect(relationshipsDesc.length).toBe(3);
    expect(relationshipsDesc[0].target.name).toBe('C_Order');
    expect(relationshipsDesc[1].target.name).toBe('B_Order');
    expect(relationshipsDesc[2].target.name).toBe('A_Order');

    // Test ASC ordering
    const relationshipsAsc = await user.findRelationships({
      alias: 'Orders',
      order: [{ on: 'target', property: 'name', direction: 'ASC' }],
    });

    expect(relationshipsAsc.length).toBe(3);
    expect(relationshipsAsc[0].target.name).toBe('A_Order');
    expect(relationshipsAsc[1].target.name).toBe('B_Order');
    expect(relationshipsAsc[2].target.name).toBe('C_Order');
  });

  it('orders relationships by relationship property', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order3 = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: 2 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: 5 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order3.id },
      properties: { Rating: 1 },
    });

    const relationships = await user.findRelationships({
      alias: 'Orders',
      order: [{ on: 'relationship', property: 'rating', direction: 'ASC' }],
    });

    expect(relationships.length).toBe(3);
    expect(relationships[0].relationship.rating).toBe(1);
    expect(relationships[0].target.id).toBe(order3.id);
    expect(relationships[1].relationship.rating).toBe(2);
    expect(relationships[1].target.id).toBe(order1.id);
    expect(relationships[2].relationship.rating).toBe(5);
    expect(relationships[2].target.id).toBe(order2.id);
  });
});

describe('findRelationships static method', () => {
  it('gets relationships via where params', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const relationship1Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 3 };

    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });
    const relationship2Properties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 5 };

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: relationship1Properties.rating },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: relationship2Properties.rating },
    });

    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    const relationship1 = relationships.find((v) => v.target.id === order1.id);
    const relationship2 = relationships.find((v) => v.target.id === order2.id);

    expect(relationship1).toBeTruthy();
    expect(relationship2).toBeTruthy();

    expect(relationship1?.relationship.rating).toEqual(
      relationship1Properties.rating,
    );
    expect(relationship2?.relationship.rating).toEqual(
      relationship2Properties.rating,
    );
  });

  it('orders by source property', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({ id: uuid(), name: 'User_A' });
    const user2 = await Users.createOne({ id: uuid(), name: 'User_B' });

    const commonOrder = await Orders.createOne({
      id: uuid(),
      name: 'Common_Order',
    });

    await user1.relateTo({
      alias: 'Orders',
      where: { id: commonOrder.id },
      properties: { Rating: 5 },
    });
    await user2.relateTo({
      alias: 'Orders',
      where: { id: commonOrder.id },
      properties: { Rating: 5 },
    });

    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { target: { id: commonOrder.id } },
      order: [{ on: 'source', property: 'name', direction: 'DESC' }],
    });

    expect(relationships.length).toBe(2);
    expect(relationships[0].source.name).toBe('User_B');
    expect(relationships[1].source.name).toBe('User_A');
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('findRelationships type safety', () => {
  it('findRelationships returns correctly typed array', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    const relationships = await user.findRelationships({
      alias: 'Orders',
    });

    // Type tests: each element should have source, target, relationship
    const rel = relationships[0];

    // source should be User instance
    const _sourceId: string = rel.source.id;
    const _sourceName: string = rel.source.name;
    expect(_sourceId).toBe(user.id);
    expect(_sourceName).toBe(user.name);

    // target should be Order instance
    const _targetId: string = rel.target.id;
    const _targetName: string = rel.target.name;
    expect(_targetId).toBe(order.id);
    expect(_targetName).toBe(order.name);

    // relationship should have rating
    const _rating: number = rel.relationship.rating;
    expect(_rating).toBe(5);

    // @ts-expect-error - 'nonExistent' is not a valid property on source
    void rel.source.nonExistent;

    // @ts-expect-error - 'nonExistent' is not a valid property on target
    void rel.target.nonExistent;

    // @ts-expect-error - 'nonExistent' is not a valid property on relationship
    void rel.relationship.nonExistent;
  });

  it('findRelationships alias must be valid', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    // Valid alias
    await user.findRelationships({ alias: 'Orders' });

    // Type test: invalid alias should cause TypeScript error at compile time
    await expect(
      // @ts-expect-error - 'InvalidAlias' is not a valid relationship alias
      user.findRelationships({ alias: 'InvalidAlias' }),
    ).rejects.toThrow();
  });

  it('findRelationships order property must match model properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    // Valid order properties
    await user.findRelationships({
      alias: 'Orders',
      order: [
        { on: 'source', property: 'name', direction: 'ASC' },
        { on: 'target', property: 'name', direction: 'DESC' },
        { on: 'relationship', property: 'rating', direction: 'ASC' },
      ],
    });

    // Type test: invalid property should cause TypeScript error at compile time
    // Note: at runtime, unknown properties don't throw - they're just ignored
    await user.findRelationships({
      alias: 'Orders',
      // @ts-expect-error - 'invalidProperty' is not a valid source property
      order: [{ on: 'source', property: 'invalidProperty', direction: 'ASC' }],
    });
  });
});
