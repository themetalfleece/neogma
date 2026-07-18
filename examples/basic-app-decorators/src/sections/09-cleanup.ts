import type { Neogma } from 'neogma';

import { log, section } from '../lib/log';

/**
 * 10. CLEANUP
 *
 * Detach-deletes every node touched by the example so the database is
 * empty when we exit.
 */
export async function cleanup(neogma: Neogma): Promise<void> {
  section('9. Cleanup');

  const labelsToWipe = [
    'ExampleUser',
    'ExampleOrder',
    'ExampleOrderItem',
    'ExampleTag',
    'ExampleDemoNode',
    'ExampleTransactionMarker',
  ];

  for (const label of labelsToWipe) {
    await neogma.queryRunner.run(`MATCH (n:${label}) DETACH DELETE n`);
  }

  log('removed all nodes/relationships with example labels');
}
