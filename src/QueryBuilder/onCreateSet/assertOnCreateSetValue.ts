import { NeogmaConstraintError } from '../../Errors';
import type { OnCreateSetI } from './getOnCreateSetString.types';
import { isOnCreateSetObject } from './getOnCreateSetString.types';

/**
 * Validates an onCreateSet value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or valid object
 */
export const assertOnCreateSetValue = (
  onCreateSet: OnCreateSetI['onCreateSet'],
): void => {
  if (typeof onCreateSet === 'string') {
    if (onCreateSet.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'onCreateSet' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (!isOnCreateSetObject(onCreateSet)) {
    throw new NeogmaConstraintError(
      `Invalid 'onCreateSet' value: expected a non-empty string or object with identifier and properties`,
    );
  }
};
