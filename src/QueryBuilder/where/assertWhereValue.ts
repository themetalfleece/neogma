import { NeogmaConstraintError } from '../../Errors';
import type { WhereI } from './getWhereString.types';

/**
 * Validates a where value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertWhereValue = (where: WhereI['where']): void => {
  if (typeof where === 'string') {
    if (where.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'where' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof where !== 'object' || where === null || Array.isArray(where)) {
    throw new NeogmaConstraintError(
      `Invalid 'where' value: expected a non-empty string or plain object, got ${Array.isArray(where) ? 'array' : typeof where}`,
    );
  }
};
