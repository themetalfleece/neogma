/**
 * neogma — JavaScript example app (no TypeScript, no decorators)
 * ------------------------------------------------------------------
 * Demonstrates every major neogma feature using ModelFactory and plain
 * JavaScript. No build step required — run directly with Node.js.
 *
 * Run with:  node src/index.js
 */

require('dotenv/config');

const { connect } = require('./lib/neogma');
const { buildModels } = require('./models');
const { demonstrateValidation } = require('./sections/01-validation');
const { demonstrateCreate } = require('./sections/02-create');
const { demonstrateRead } = require('./sections/03-read');
const { demonstrateUpdate } = require('./sections/04-update');
const { demonstrateRelationships } = require('./sections/05-relationships');
const { demonstrateQueryBuilder } = require('./sections/06-query-builder');
const { demonstrateSessions } = require('./sections/07-sessions');
const { demonstrateDelete } = require('./sections/08-delete');
const { cleanup } = require('./sections/09-cleanup');

async function main() {
  const neogma = await connect();
  try {
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
