import { NeogmaConstraintError } from '../../Errors';
import type { WithI } from './getWithString.types';

/**
 * Validates a with value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or array of strings
 */
export const assertWithValue = (wth: WithI['with']): void => {
  if (typeof wth === 'string') {
    if (wth.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'with' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (Array.isArray(wth)) {
    if (
      wth.length === 0 ||
      !wth.every((s) => typeof s === 'string' && s.trim().length > 0)
    ) {
      throw new NeogmaConstraintError(
        `Invalid 'with' value: expected a non-empty array of non-empty strings`,
      );
    }
    return;
  }
  throw new NeogmaConstraintError(
    `Invalid 'with' value: expected a non-empty string or array of strings, got ${typeof wth}`,
  );
};
