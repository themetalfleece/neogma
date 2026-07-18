/**
 * neogma — end-to-end example app
 * ------------------------------------------------------------------
 * Runs a single script that exercises every major neogma feature
 * against a local Neo4j instance, then tears down everything it
 * created.
 *
 * The script is organised as one file per "section" under `src/sections/`,
 * with the decorated node classes living under `src/models/`. This file is
 * just an orchestrator.
 *
 * Run with:  pnpm --filter @neogma-examples/basic-app dev
 */

import 'dotenv/config';

import { connect } from './lib/neogma';
import { buildModels } from './models';
import { demonstrateValidation } from './sections/01-validation';
import { demonstrateCreate } from './sections/02-create';
import { demonstrateRead } from './sections/03-read';
import { demonstrateUpdate } from './sections/04-update';
import { demonstrateRelationships } from './sections/05-relationships';
import { demonstrateQueryBuilder } from './sections/06-query-builder';
import { demonstrateSessions } from './sections/07-sessions';
import { demonstrateDelete } from './sections/08-delete';
import { cleanup } from './sections/09-cleanup';

async function main(): Promise<void> {
  const neogma = await connect();
  try {
    // Clean any leftovers from a previous run before we begin
    await cleanup(neogma);
    const models = buildModels(neogma);

    await demonstrateValidation(models.Users);
    const ids = await demonstrateCreate(models);
    await demonstrateRead(models, ids);
    await demonstrateUpdate(models, ids.aliceId);
    await demonstrateRelationships(models, ids);
    await demonstrateQueryBuilder(neogma, models);
    await demonstrateSessions(neogma);
    await demonstrateDelete(models, { chrisId: ids.chrisId });
    await cleanup(neogma);

    console.log('\nAll sections completed successfully.\n');
  } finally {
    await neogma.driver.close();
  }
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exitCode = 1;
});
