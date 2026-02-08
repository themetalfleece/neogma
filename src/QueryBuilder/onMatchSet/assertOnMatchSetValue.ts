import { NeogmaConstraintError } from '../../Errors';
import type { OnMatchSetI } from './getOnMatchSetString.types';
import { isOnMatchSetObject } from './getOnMatchSetString.types';

/**
 * Validates an onMatchSet value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or valid object
 */
export const assertOnMatchSetValue = (
  onMatchSet: OnMatchSetI['onMatchSet'],
): void => {
  if (typeof onMatchSet === 'string') {
    if (onMatchSet.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'onMatchSet' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (!isOnMatchSetObject(onMatchSet)) {
    throw new NeogmaConstraintError(
      `Invalid 'onMatchSet' value: expected a non-empty string or object with identifier and properties`,
    );
  }
};
