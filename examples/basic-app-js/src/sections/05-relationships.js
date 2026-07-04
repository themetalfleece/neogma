const { Op } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateRelationships(models, ids) {
  const { Users, Orders } = models;
  section('5. Relationships');

  await Users.relateTo({
    alias: 'Orders',
    where: {
      source: { id: ids.bobId },
      target: { id: ids.bobOrderId },
    },
    properties: { Rating: 4 },
  });
  log('Users.relateTo(Bob → Order) attached with rating 4');

  const aliceInstance = await Users.findOne({ where: { id: ids.aliceId } });
  if (aliceInstance) {
    await aliceInstance.relateTo({
      alias: 'Tagged',
      where: { id: ids.tagId },
    });
    log('instance.relateTo(Alice → VIP)');
  }

  await Orders.relateTo({
    alias: 'Items',
    where: {
      source: { id: ids.bobOrderId },
      target: { id: { [Op.in]: ids.itemIds } },
    },
    properties: { Quantity: 2 },
  });
  log(`linked ${ids.itemIds.length} items to Bob's order`);

  const aliceRels = await Users.findRelationships({
    alias: 'Orders',
    where: { source: { id: ids.aliceId } },
    limit: 10,
  });
  log(
    'findRelationships(Alice → Orders):',
    aliceRels.map((r) => `rating=${r.relationship.rating}`),
  );

  if (aliceInstance) {
    const instanceRels = await aliceInstance.findRelationships({
      alias: 'Tagged',
    });
    log(
      'instance.findRelationships(Alice → Tagged):',
      instanceRels.length,
      'edge(s)',
    );
  }

  await Users.createRelationship({
    source: { label: Users.getLabel() },
    target: { label: 'ExampleTag' },
    relationship: { name: 'TAGGED_AS', direction: 'out' },
    where: { source: { id: ids.bobId }, target: { id: ids.tagId } },
  });
  log('Users.createRelationship(Bob → VIP) via raw API');

  const removed = await Users.deleteRelationships({
    alias: 'Tagged',
    where: { source: { id: ids.bobId }, target: { id: ids.tagId } },
  });
  log(`deleteRelationships removed ${removed} rel(s)`);
}

module.exports = { demonstrateRelationships };
