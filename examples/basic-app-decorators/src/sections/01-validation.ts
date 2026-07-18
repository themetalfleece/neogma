import { randomUUID } from 'crypto';
import { NeogmaInstanceValidationError } from 'neogma';

import { log, section } from '../lib/log';
import type { Models } from '../models';

/**
 * 2. VALIDATION
 *
 * Uses `Model.build()` (no DB write) to demonstrate TypeBox-driven
 * validation. Failed validations throw `NeogmaInstanceValidationError`.
 */
export async function demonstrateValidation(
  Users: Models['Users'],
): Promise<void> {
  section('1. Validation');

  const invalid = Users.build({
    id: randomUUID(),
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
    id: randomUUID(),
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
  });

  await valid.validate();

  log('valid user passed validation:', valid.dataValues.name);
}
