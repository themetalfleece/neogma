const { log, section } = require('../lib/log');

async function cleanup(neogma) {
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

module.exports = { cleanup };
