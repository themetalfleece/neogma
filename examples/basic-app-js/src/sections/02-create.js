const { randomUUID: uuid } = require('crypto');
const { log, section } = require('../lib/log');

async function demonstrateCreate(models) {
  const { Users, Orders, OrderItems, Tags } = models;
  section('2. Create');

  const aliceId = uuid();
  const alice = await Users.createOne({
    id: aliceId,
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
    Orders: {
      properties: [
        {
          id: uuid(),
          name: 'Birthday gift',
          status: 'placed',
          total: 42,
          Rating: 5,
        },
      ],
    },
  });
  log('createOne (with nested order):', alice.name, '→', alice.dataValues.id);

  const bobId = uuid();
  const chrisId = uuid();
  await Users.createMany([
    { id: bobId, name: 'Bob', email: 'bob@example.com', age: 24 },
    { id: chrisId, name: 'Chris', email: 'chris@example.com', age: 45 },
  ]);
  log('createMany inserted Bob & Chris');

  const bobOrderId = uuid();
  await Orders.createMany([
    { id: bobOrderId, name: 'Stationery', status: 'placed', total: 12.5 },
    { id: uuid(), name: 'Books', status: 'shipped', total: 76 },
  ]);

  const itemIds = [uuid(), uuid()];
  await OrderItems.createMany([
    { id: itemIds[0], sku: 'PEN-001', price: 1.5 },
    { id: itemIds[1], sku: 'NOTE-014', price: 4.25 },
  ]);

  const tagId = uuid();
  await Tags.createOne({ id: tagId, name: 'VIP' });

  log('seed graph built: 3 users, 3 orders, 2 items, 1 tag');
  return { aliceId, bobId, chrisId, bobOrderId, itemIds, tagId };
}

module.exports = { demonstrateCreate };
