import { NeogmaConstraintError } from '../../Errors';
import type { OrderByI } from './getOrderByString.types';
import { isOrderByObject } from './getOrderByString.types';

/**
 * Validates an orderBy value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string, array, or object
 */
export const assertOrderByValue = (orderBy: OrderByI['orderBy']): void => {
  if (typeof orderBy === 'string') {
    if (orderBy.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'orderBy' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (Array.isArray(orderBy)) {
    if (orderBy.length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'orderBy' value: expected a non-empty array`,
      );
    }
    return;
  }
  if (!isOrderByObject(orderBy)) {
    throw new NeogmaConstraintError(
      `Invalid 'orderBy' value: object must have a non-empty 'identifier' property`,
    );
  }
};
