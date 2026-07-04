const { Op } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateRead(models, ids) {
  const { Users, Orders } = models;
  section('3. Read (operators + eager loading)');

  const alice = await Users.findOne({ where: { id: ids.aliceId } });
  log('findOne(Alice) →', alice?.name, alice?.email);

  const grownUps = await Users.findMany({
    where: {
      age: { [Op.gte]: 18 },
      email: { [Op.contains]: '@' },
      id: { [Op.in]: [ids.aliceId, ids.bobId] },
    },
    order: [['name', 'ASC']],
    limit: 10,
    skip: 0,
  });
  log(
    'findMany(grown-ups) →',
    grownUps.map((u) => u.name),
  );

  const aliceWithOrders = await Users.findOne({
    where: { id: ids.aliceId },
    relationships: {
      Orders: {
        order: [{ on: 'relationship', property: 'rating', direction: 'DESC' }],
        limit: 5,
      },
    },
  });

  const aliceOrders = aliceWithOrders?.Orders ?? [];
  log(
    'eager Orders for Alice →',
    aliceOrders.map((o) => `${o.node.name} (rating ${o.relationship.rating})`),
  );

  const placedOrShipped = await Orders.findMany({
    where: { status: { [Op.in]: ['placed', 'shipped'] } },
    order: [['total', 'DESC']],
  });
  log(
    'orders by status placed|shipped →',
    placedOrShipped.map((o) => o.name),
  );
}

module.exports = { demonstrateRead };
