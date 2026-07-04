const { randomUUID: uuid } = require('crypto');
const { NeogmaInstanceValidationError } = require('neogma');
const { log, section } = require('../lib/log');

async function demonstrateValidation(Users) {
  section('1. Validation');

  const invalid = Users.build({
    id: uuid(),
    name: 'A', // too short — minLength 2
    email: 'not-an-email',
    age: 999, // above maximum
  });

  try {
    await invalid.validate();
  } catch (e) {
    if (e instanceof NeogmaInstanceValidationError) {
      log('caught NeogmaInstanceValidationError (expected):', e.message);
    } else {
      throw e;
    }
  }

  const valid = Users.build({
    id: uuid(),
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
  });

  await valid.validate();
  log('valid user passed validation:', valid.dataValues.name);
}

module.exports = { demonstrateValidation };
