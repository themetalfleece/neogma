const { randomUUID: uuid } = require('crypto');
const { log, section } = require('../lib/log');

async function demonstrateSessions(neogma) {
  section('7. Sessions & transactions');

  const userCount = await neogma.getSession(null, async (session) => {
    const result = await session.run(
      'MATCH (u:ExampleUser) RETURN count(u) AS c',
    );
    return result.records[0].get('c').toNumber();
  });
  log('getSession → user count =', userCount);

  const markerId = uuid();
  await neogma.getTransaction(null, async (tx) => {
    await tx.run('CREATE (:ExampleTransactionMarker {id: $id})', {
      id: markerId,
    });
  });
  log('getTransaction(success) committed a marker node');

  try {
    await neogma.getTransaction(null, async (tx) => {
      await tx.run('CREATE (:ExampleTransactionMarker {id: $id})', {
        id: uuid(),
      });
      throw new Error('intentional rollback');
    });
  } catch (e) {
    log('getTransaction(failure) rolled back:', e.message);
  }
}

module.exports = { demonstrateSessions };
