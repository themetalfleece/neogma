import { NeogmaConstraintError } from '../../Errors';
import type { SkipI } from './getSkipString.types';

/**
 * Validates a SKIP value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or number
 */
export const assertSkipValue = (skip: SkipI['skip']): void => {
  if (typeof skip === 'string') {
    if (skip.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'skip' value: expected a non-empty string or number`,
      );
    }
    return;
  }
  if (typeof skip !== 'number') {
    throw new NeogmaConstraintError(
      `Invalid 'skip' value: expected a non-empty string or number, got ${typeof skip}`,
    );
  }
};
