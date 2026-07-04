const { randomUUID: uuid } = require('crypto');
const { BindParam, Literal, QueryBuilder } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateQueryBuilder(neogma, models) {
  const { Users, Orders } = models;
  section('6. QueryBuilder (every clause)');

  const bindParam = new BindParam({ minRating: 3 });

  const qb = new QueryBuilder(bindParam)
    .match({
      related: [
        { identifier: 'u', model: Users },
        { ...Users.getRelationshipByAlias('Orders'), identifier: 'r' },
        { identifier: 'o', model: Orders },
      ],
    })
    .where('r.rating >= $minRating')
    .with(['u', 'o', 'r'])
    .return(['u.name AS user', 'o.name AS order', 'r.rating AS rating'])
    .orderBy([['rating', 'DESC']])
    .skip(0)
    .limit(10);

  const result = await qb.run(neogma.queryRunner);
  log('typed read query returned', result.records.length, 'rows');
  for (const rec of result.records) {
    log('  •', rec.get('user'), '→', rec.get('order'), `(${rec.get('rating')})`);
  }

  const optional = await new QueryBuilder()
    .match({ identifier: 'u', model: Users })
    .match({
      optional: true,
      related: [
        { identifier: 'u' },
        { ...Users.getRelationshipByAlias('Tagged'), identifier: 't' },
        { identifier: 'tag', label: 'ExampleTag' },
      ],
    })
    .return(['u.id AS id', 'collect(tag.name) AS tags'])
    .raw('// optional-match read demo')
    .run(neogma.queryRunner);
  log('optional-match read returned', optional.records.length, 'rows');

  const demoLabel = 'ExampleDemoNode';

  await neogma
    .getTransaction(null, async (tx) => {
      const bp = new BindParam({ seedIds: [uuid(), uuid()] });
      const nameParam = bp.getUniqueNameAndAdd('name', 'Mutation Demo');

      const subQuery = new QueryBuilder(bp).with(['1 AS one']).return(['one']);

      await new QueryBuilder(bp)
        .unwind('$seedIds AS sid')
        .merge(`(demo:${demoLabel} { id: sid })`)
        .onCreateSet('demo.createdAt = datetime()')
        .onMatchSet('demo.touchedAt = datetime()')
        .set(`demo.name = $${nameParam}`)
        .with(['demo'])
        .call(subQuery)
        .return(['demo.id AS id'])
        .run(neogma.queryRunner, tx);

      await new QueryBuilder()
        .match({ identifier: 'demo', label: demoLabel })
        .set('demo.touchedAt = ' + new Literal('datetime()').getValue())
        .return(['demo.id AS id'])
        .run(neogma.queryRunner, tx);

      const cleanup = await new QueryBuilder()
        .match({ identifier: 'demo', label: demoLabel })
        .remove({ identifier: 'demo', properties: ['touchedAt'] })
        .delete({ identifiers: 'demo', detach: true })
        .run(neogma.queryRunner, tx);
      log(
        'mutation chain + remove/delete inside tx, contains updates:',
        cleanup.summary.counters.containsUpdates(),
      );

      throw new Error('__demo-rollback__');
    })
    .catch((e) => {
      if (e.message !== '__demo-rollback__') throw e;
      log('transaction rolled back as designed (nothing persisted)');
    });

  const forEachQb = new QueryBuilder()
    .match({ identifier: 'u', model: Users })
    .forEach('(_ IN [u] | SET _.lastSeen = datetime())');
  log('forEach generated cypher:', forEachQb.getStatement());
}

module.exports = { demonstrateQueryBuilder };
