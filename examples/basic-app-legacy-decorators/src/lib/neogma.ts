import { Neogma } from 'neogma';

import { log, section } from './log';

export async function connect(): Promise<Neogma> {
  section('Connect to Neo4j');
  const neogma = new Neogma(
    {
      url: process.env.NEO4J_URL ?? 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME ?? 'neo4j',
      password: process.env.NEO4J_PASSWORD ?? 'password',
    },
    {
      // optional logger — receives every Cypher statement neogma runs
      logger: undefined,
    },
  );
  await neogma.verifyConnectivity();
  log('connected; default db =', neogma.database ?? '(server default)');
  return neogma;
}
