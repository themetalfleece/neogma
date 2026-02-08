import { NeogmaConstraintError } from '../../Errors';
import type { ForEachI } from './getForEachString.types';

/**
 * Validates a forEach value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string
 */
export const assertForEachValue = (forEach: ForEachI['forEach']): void => {
  if (typeof forEach !== 'string' || forEach.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'forEach' value: expected a non-empty string, got ${typeof forEach}`,
    );
  }
};
