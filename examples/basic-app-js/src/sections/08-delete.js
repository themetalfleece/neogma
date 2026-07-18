const { Op } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateDelete(models, ids) {
  const { Users } = models;
  section('8. Delete');

  const chris = await Users.findOne({ where: { id: ids.chrisId } });
  if (chris) {
    await chris.delete({ detach: true });
    log('instance.delete(Chris) — detached');
  }

  const remainingUsers = await Users.findMany({});
  const remainingIds = remainingUsers.map((u) => u.id);
  const removedCount = await Users.delete({
    where: { id: { [Op.in]: remainingIds } },
    detach: true,
  });
  log(`Model.delete removed ${removedCount} remaining user(s)`);
}

module.exports = { demonstrateDelete };
