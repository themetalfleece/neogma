import { NeogmaConstraintError } from '../../Errors';
import type { UnwindI } from './getUnwindString.types';
import { isUnwindObject } from './getUnwindString.types';

/**
 * Validates an unwind value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or valid object
 */
export const assertUnwindValue = (unwind: UnwindI['unwind']): void => {
  if (typeof unwind === 'string') {
    if (unwind.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'unwind' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (!isUnwindObject(unwind)) {
    throw new NeogmaConstraintError(
      `Invalid 'unwind' value: expected a non-empty string or object with value and as`,
    );
  }
};
