import { Op } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 9. DELETE
 *
 * Exercises `instance.delete({ detach: true })` and the static
 * `Model.delete` (which returns the deleted node count).
 */
export async function demonstrateDelete(
  models: Models,
  ids: { chrisId: string },
): Promise<void> {
  const { Users } = models;
  section('8. Delete');

  const chris = await Users.findOne({ where: { id: ids.chrisId } });
  if (chris) {
    await chris.delete({ detach: true });
    log('instance.delete(Chris) — detached');
  }

  const remainingUsers = await Users.findMany({});
  const remainingIds = remainingUsers.map((u) => u.id);
  const removedCount = await Users.delete({
    where: { id: { [Op.in]: remainingIds } },
    detach: true,
  });

  log(`Model.delete removed ${removedCount} remaining user(s)`);
}
