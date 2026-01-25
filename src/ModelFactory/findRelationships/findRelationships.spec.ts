import { randomUUID as uuid } from 'crypto';

import { Op } from '../../Where';
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

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time
 * for source, target, and relationship where parameters.
 */
describe('findRelationships where type safety', () => {
  it('accepts valid where parameters for source, target, relationship', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-check tests - verify valid parameters compile correctly
    // Use wrapper to check types without executing database queries
    const _typeCheck = (_fn: () => void) => {};

    // Valid: correct property names and types for all entities
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: { id: 'user-id', name: 'John' },
          target: { id: 'order-id', name: 'Order1' },
          relationship: { rating: 5 },
        },
      }),
    );

    // Valid: using operators with correct types
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: { id: { [Op.eq]: 'user-id' } },
          target: { name: { [Op.contains]: 'Order' } },
          relationship: { rating: { [Op.gte]: 3 } },
        },
      }),
    );

    // Valid: partial where (only source)
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: { source: { id: 'user-id' } },
      }),
    );

    // Valid: partial where (only target)
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: { target: { name: 'Order1' } },
      }),
    );

    // Valid: partial where (only relationship)
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: { relationship: { rating: 5 } },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects invalid property names in source where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            id: 'valid',
            // @ts-expect-error - 'nam' is not a valid source property (typo)
            nam: 'John',
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            // @ts-expect-error - 'userId' is not a valid source property
            userId: 'test',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects invalid property names in target where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - 'orderId' is not a valid target property
            orderId: 'test',
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            id: 'valid',
            // @ts-expect-error - 'nonExistent' is not a valid target property
            nonExistent: 'value',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects invalid property names in relationship where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: 5,
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            rating: 5,
            // @ts-expect-error - 'invalid' is not a valid relationship property
            invalid: 'value',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in source where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            // @ts-expect-error - 'id' expects string, not number
            id: 123,
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            // @ts-expect-error - 'name' expects string, not boolean
            name: true,
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in target where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - 'id' expects string, not number
            id: 456,
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - 'name' expects string, not object
            name: { value: 'test' },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in relationship where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - 'rating' expects number, not string
            rating: 'high',
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - 'rating' expects number, not boolean
            rating: true,
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators for all entities', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    // Source: wrong type in operator
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            // @ts-expect-error - Op.eq expects string for 'id', not number
            id: { [Op.eq]: 123 },
          },
        },
      }),
    );

    // Target: wrong type in operator
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - Op.in expects string[] for 'name', not number[]
            name: { [Op.in]: [1, 2, 3] },
          },
        },
      }),
    );

    // Relationship: wrong type in operator
    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - Op.gte expects number for 'rating', not string
            rating: { [Op.gte]: 'high' },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          source: {
            // @ts-expect-error - 'invalid' is not a valid source property
            invalid: { [Op.eq]: 'value' },
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - 'typo' is not a valid target property
            typo: { [Op.contains]: 'test' },
          },
        },
      }),
    );

    _typeCheck(() =>
      Users.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: { [Op.gt]: 5 },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('instance method findRelationships also validates where types', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    // Valid where for instance method
    await user.findRelationships({
      alias: 'Orders',
      where: {
        target: { id: 'order-id' },
        relationship: { rating: 5 },
      },
    });

    // Type-only tests - use wrapper to avoid runtime execution
    const _typeCheck = (_fn: () => void) => {};

    // Invalid property name in target
    _typeCheck(() =>
      user.findRelationships({
        alias: 'Orders',
        where: {
          target: {
            // @ts-expect-error - 'orderId' is not a valid target property
            orderId: 'test',
          },
        },
      }),
    );

    // Wrong value type in relationship
    _typeCheck(() =>
      user.findRelationships({
        alias: 'Orders',
        where: {
          relationship: {
            // @ts-expect-error - 'rating' expects number, not string
            rating: 'high',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });
});
