import { NeogmaConstraintError } from '../../Errors';
import type { CallI } from './getCallString.types';

/**
 * Validates a call value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string
 */
export const assertCallValue = (call: CallI['call']): void => {
  if (typeof call !== 'string' || call.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'call' value: expected a non-empty string, got ${typeof call}`,
    );
  }
};
