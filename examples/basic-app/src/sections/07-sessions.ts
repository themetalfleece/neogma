import { randomUUID } from 'crypto';
import type { Neogma } from 'neogma';

import { log, section } from '../lib/log';

/**
 * 8. SESSIONS / TRANSACTIONS
 *
 * Exercises both `getSession` and `getTransaction` (success + rollback).
 */
export async function demonstrateSessions(neogma: Neogma): Promise<void> {
  section('7. Sessions & transactions');

  // getSession — explicit session that auto-closes
  const userCount = await neogma.getSession(null, async (session) => {
    const result = await session.run(
      'MATCH (u:ExampleUser) RETURN count(u) AS c',
    );
    return result.records[0].get('c').toNumber();
  });

  log('getSession → user count =', userCount);

  // getTransaction — commit path
  const markerId = randomUUID();
  await neogma.getTransaction(null, async (tx) => {
    await tx.run('CREATE (:ExampleTransactionMarker {id: $id})', {
      id: markerId,
    });
  });

  log('getTransaction(success) committed a marker node');

  // getTransaction — rollback path
  try {
    await neogma.getTransaction(null, async (tx) => {
      await tx.run('CREATE (:ExampleTransactionMarker {id: $id})', {
        id: randomUUID(),
      });
      throw new Error('intentional rollback');
    });
  } catch (e) {
    log('getTransaction(failure) rolled back:', (e as Error).message);
  }
}
