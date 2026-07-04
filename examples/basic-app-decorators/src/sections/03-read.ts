import { Op } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 4. READ
 *
 * Exercises `findOne`, `findMany` with `Op.gte` / `Op.in` / `Op.contains`,
 * ordering / paging, and eager-loaded relationships.
 */
export async function demonstrateRead(
  models: Models,
  ids: { aliceId: string; bobId: string },
): Promise<void> {
  const { Users, Orders } = models;
  section('3. Read (operators + eager loading)');

  const alice = await Users.findOne({ where: { id: ids.aliceId } });
  log('findOne(Alice) →', alice?.name, alice?.email);

  // findMany with operator usage — Op.gte, Op.in, Op.contains
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

  // findOne with eager-loaded relationships
  const aliceWithOrders = await Users.findOne({
    where: { id: ids.aliceId },
    relationships: {
      Orders: {
        order: [{ on: 'relationship', property: 'rating', direction: 'DESC' }],
        limit: 5,
      },
    },
  });

  // Eager-loaded edges have shape `{ node, relationship }` and are typed on
  // the returned instance via `InstanceWithRelationships<>`.
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
