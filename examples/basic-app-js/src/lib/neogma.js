const { Neogma } = require('neogma');
const { log, section } = require('./log');

/** @returns {Promise<import('neogma').Neogma>} */
async function connect() {
  section('Connect to Neo4j');
  const neogma = new Neogma(
    {
      url: process.env.NEO4J_URL ?? 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME ?? 'neo4j',
      password: process.env.NEO4J_PASSWORD ?? 'password',
    },
    {
      logger: undefined,
    },
  );
  await neogma.verifyConnectivity();
  log('connected; default db =', neogma.database ?? '(server default)');
  return neogma;
}

module.exports = { connect };
