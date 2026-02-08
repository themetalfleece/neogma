import { NeogmaConstraintError } from '../../Errors';
import type { SetI } from './getSetString.types';
import { isSetObject } from './isSetParameter';

/**
 * Validates a SET value and throws if invalid.
 * Call this from getSetString to validate input.
 * @throws NeogmaConstraintError if value is invalid
 */
export const assertSetValue = (set: SetI['set']): void => {
  if (typeof set === 'string') {
    if (set.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'set' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (!isSetObject(set)) {
    throw new NeogmaConstraintError(
      `Invalid 'set' value: expected a non-empty string or object with identifier and properties`,
    );
  }
};
