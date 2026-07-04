import { Op } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 6. RELATIONSHIPS
 *
 * Exercises:
 *  - static `Model.relateTo` (with relationship-property alias keys)
 *  - instance `relateTo`
 *  - `findRelationships` (static + instance)
 *  - `Model.createRelationship` raw API
 *  - `deleteRelationships` returning a count
 */
export async function demonstrateRelationships(
  models: Models,
  ids: {
    aliceId: string;
    bobId: string;
    bobOrderId: string;
    itemIds: string[];
    tagId: string;
  },
): Promise<void> {
  const { Users, Orders } = models;
  section('5. Relationships');

  // Static relateTo (Bob -> existing order)
  await Users.relateTo({
    alias: 'Orders',
    where: {
      source: { id: ids.bobId },
      target: { id: ids.bobOrderId },
    },
    properties: { Rating: 4 },
  });

  log('Users.relateTo(Bob → Order) attached with rating 4');

  // Instance relateTo (Alice -> Tag)
  const aliceInstance = await Users.findOne({ where: { id: ids.aliceId } });

  if (aliceInstance) {
    await aliceInstance.relateTo({
      alias: 'Tagged',
      where: { id: ids.tagId },
    });

    log('instance.relateTo(Alice → VIP)');
  }

  // Add items to Bob's order via static relateTo (Op.in on the target where)
  await Orders.relateTo({
    alias: 'Items',
    where: {
      source: { id: ids.bobOrderId },
      target: { id: { [Op.in]: ids.itemIds } },
    },
    properties: { Quantity: 2 },
  });

  log(`linked ${ids.itemIds.length} items to Bob's order`);

  // findRelationships (static + instance variants)
  const aliceRels = await Users.findRelationships({
    alias: 'Orders',
    where: { source: { id: ids.aliceId } },
    limit: 10,
  });

  log(
    'findRelationships(Alice → Orders):',
    aliceRels.map(
      (r) => `rating=${(r.relationship as { rating: number }).rating}`,
    ),
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

  // createRelationship: raw API (no `alias` — pass source/target/relationship)
  await Users.createRelationship({
    source: { label: Users.getLabel() },
    target: { label: 'ExampleTag' },
    relationship: { name: 'TAGGED_AS', direction: 'out' },
    where: { source: { id: ids.bobId }, target: { id: ids.tagId } },
  });

  log('Users.createRelationship(Bob → VIP) via raw API');

  // deleteRelationships — returns count of removed relationships
  const removed = await Users.deleteRelationships({
    alias: 'Tagged',
    where: { source: { id: ids.bobId }, target: { id: ids.tagId } },
  });

  log(`deleteRelationships removed ${removed} rel(s)`);
}
