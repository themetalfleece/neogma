import { NeogmaNotFoundError } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 5. UPDATE
 *
 * Exercises `instance.save()` with `changed`-tracking, the static
 * `Model.update` (which returns `[instances[], QueryResult]`), and an
 * instance method derived from the decorated class.
 */
export async function demonstrateUpdate(
  models: Models,
  aliceId: string,
): Promise<void> {
  const { Users, Orders } = models;
  section('4. Update');

  const alice = await Users.findOne({ where: { id: aliceId } });

  if (!alice) {
    throw new NeogmaNotFoundError('Alice missing — seed failed');
  }

  alice.name = 'Alicia';
  alice.age = 31;
  log('changed fields before save →', alice.changed);
  await alice.save();
  log('after save, dataValues.name =', alice.dataValues.name);

  // Bulk Model.update — returns [instances[], QueryResult]
  const [updatedNodes, queryResult] = await Orders.update(
    { status: 'archived' },
    { where: { status: 'placed' }, return: true },
  );

  const counters = queryResult.summary.counters.updates();

  log(
    `Model.update set ${counters.propertiesSet} props across ${updatedNodes.length} order(s)`,
  );

  // Instance method declared on the decorated class
  log('instance method greet() →', alice.greet());
}
