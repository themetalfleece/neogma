const { NeogmaNotFoundError } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateUpdate(models, aliceId) {
  const { Users, Orders } = models;
  section('4. Update');

  const alice = await Users.findOne({ where: { id: aliceId } });
  if (!alice) {
    throw new NeogmaNotFoundError('Alice missing — seed failed');
  }

  alice.name = 'Alicia';
  alice.age = 31;
  log('changed fields before save →', alice.changed);
  await alice.save();
  log('after save, dataValues.name =', alice.dataValues.name);

  const [updatedNodes, queryResult] = await Orders.update(
    { status: 'archived' },
    { where: { status: 'placed' }, return: true },
  );

  const counters = queryResult.summary.counters.updates();
  log(
    `Model.update set ${counters.propertiesSet} props across ${updatedNodes.length} order(s)`,
  );
}

module.exports = { demonstrateUpdate };
