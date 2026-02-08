import { NeogmaConstraintError } from '../../Errors';
import type { LimitI } from './getLimitString.types';

/**
 * Validates a LIMIT value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or number
 */
export const assertLimitValue = (limit: LimitI['limit']): void => {
  if (typeof limit === 'string') {
    if (limit.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'limit' value: expected a non-empty string or number`,
      );
    }
    return;
  }
  if (typeof limit !== 'number') {
    throw new NeogmaConstraintError(
      `Invalid 'limit' value: expected a non-empty string or number, got ${typeof limit}`,
    );
  }
};
