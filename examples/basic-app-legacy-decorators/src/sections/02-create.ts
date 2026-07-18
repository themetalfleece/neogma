import { randomUUID } from 'crypto';

import { log, section } from '../lib/log';
import type { Models } from '../models';

export interface SeedIds {
  aliceId: string;
  bobId: string;
  chrisId: string;
  bobOrderId: string;
  itemIds: string[];
  tagId: string;
}

/**
 * 3. CREATE
 *
 * Exercises:
 *  - `createOne` with a nested related-node create + relationship properties
 *  - `createMany` for bulk inserts at the top level
 */
export async function demonstrateCreate(models: Models): Promise<SeedIds> {
  const { Users, Orders, OrderItems, Tags } = models;
  section('2. Create');

  // createOne with nested-create of a related node + relationship properties.
  // Each entry in `properties` is `Properties & Partial<RelationshipProperties>`.
  const aliceId = randomUUID();
  const aliceOrderId = randomUUID();
  const alice = await Users.createOne({
    id: aliceId,
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
    Orders: {
      properties: [
        {
          id: aliceOrderId,
          name: 'Birthday gift',
          status: 'placed',
          total: 42,
          Rating: 5,
        },
      ],
    },
  });
  log('createOne (with nested order):', alice.name, '→', alice.dataValues.id);

  // createMany — bulk create at the top level
  const bobId = randomUUID();
  const chrisId = randomUUID();
  await Users.createMany([
    { id: bobId, name: 'Bob', email: 'bob@example.com', age: 24 },
    { id: chrisId, name: 'Chris', email: 'chris@example.com', age: 45 },
  ]);
  log('createMany inserted Bob & Chris');

  // Seed standalone orders we'll relate to later
  const bobOrderId = randomUUID();
  const chrisOrderId = randomUUID();
  await Orders.createMany([
    { id: bobOrderId, name: 'Stationery', status: 'placed', total: 12.5 },
    { id: chrisOrderId, name: 'Books', status: 'shipped', total: 76 },
  ]);

  const itemIds = [randomUUID(), randomUUID()];
  await OrderItems.createMany([
    { id: itemIds[0], sku: 'PEN-001', price: 1.5 },
    { id: itemIds[1], sku: 'NOTE-014', price: 4.25 },
  ]);

  const tagId = randomUUID();
  await Tags.createOne({ id: tagId, name: 'VIP' });

  log('seed graph built: 3 users, 3 orders, 2 items, 1 tag');

  return { aliceId, bobId, chrisId, bobOrderId, itemIds, tagId };
}
