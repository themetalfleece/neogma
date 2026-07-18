import { randomUUID } from 'crypto';
import { BindParam, Literal, type Neogma, QueryBuilder } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 7. QUERYBUILDER
 *
 * Exercises a typed read query, an `optional match`, and a full
 * mutation chain (`unwind` / `merge` / `onCreateSet` / `onMatchSet` /
 * `set` / `call` / `remove` / `delete`) inside a rollback transaction
 * so the example does not litter the database.
 */
export async function demonstrateQueryBuilder(
  neogma: Neogma,
  models: Models,
): Promise<void> {
  const { Users, Orders } = models;
  section('6. QueryBuilder (every clause)');

  // --- Execution path: a typed read query with match/where/with/orderBy/etc. ---
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
    log(
      '  •',
      rec.get('user'),
      '→',
      rec.get('order'),
      `(${rec.get('rating')})`,
    );
  }

  // --- Optional-match + raw — also a real run. ---
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

  // --- Mutation chain in a rollback transaction. ---
  //     Covers merge / onCreateSet / onMatchSet / set / unwind / call / remove / delete.
  const demoLabel = 'ExampleDemoNode';

  await neogma
    .getTransaction(null, async (tx) => {
      const bp = new BindParam({
        seedIds: [randomUUID(), randomUUID()],
      });
      const nameParam = bp.getUniqueNameAndAdd('name', 'Mutation Demo');

      // CALL sub-query — must share the parent's BindParam (QueryBuilder.call
      // enforces this so generated bind parameter names don't collide).
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

      // Literal is exercised here for `now` (use it via raw set)
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

      // Throw to force rollback so nothing lands in the database.
      throw new Error('__demo-rollback__');
    })
    .catch((e: unknown) => {
      if ((e as Error).message !== '__demo-rollback__') throw e;
      log('transaction rolled back as designed (nothing persisted)');
    });

  // --- forEach is exercised via `getStatement()` only — it is a write-side
  //     clause that only makes sense inside CREATE/MERGE pipelines. ---
  const forEachQb = new QueryBuilder()
    .match({ identifier: 'u', model: Users })
    .forEach('(_ IN [u] | SET _.lastSeen = datetime())');
  log('forEach generated cypher:', forEachQb.getStatement());
}
