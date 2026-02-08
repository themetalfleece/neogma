import { NeogmaConstraintError } from '../../Errors';
import type { ReturnI } from './getReturnString.types';
import { isReturnObject, isValidReturnElement } from './isReturnParameter';

/**
 * Validates a RETURN value and throws if invalid.
 * Call this from getReturnString to validate input.
 * @throws NeogmaConstraintError if value is invalid
 */
export const assertReturnValue = (rtn: ReturnI['return']): void => {
  if (typeof rtn === 'string') {
    if (rtn.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'return' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (!Array.isArray(rtn)) {
    throw new NeogmaConstraintError(
      `Invalid 'return' value: expected a non-empty string or array of non-empty strings/objects with identifier`,
    );
  }
  for (const item of rtn) {
    if (!isValidReturnElement(item)) {
      throw new NeogmaConstraintError(
        `Invalid 'return' value: expected a non-empty string or array of non-empty strings/objects with identifier`,
      );
    }
  }
};

/**
 * Validates a ReturnObjectI value and throws if invalid.
 * @throws NeogmaConstraintError if param is an array of objects but contains invalid elements
 */
export const assertReturnObject = (param: ReturnI['return']): void => {
  if (!Array.isArray(param)) {
    return; // Not an array - nothing to validate for ReturnObjectI
  }
  // Only validate if it looks like an object array (no strings)
  const hasOnlyObjects = param.every(
    (item) => typeof item === 'object' && item !== null,
  );
  if (hasOnlyObjects && !isReturnObject(param)) {
    throw new NeogmaConstraintError(
      `Invalid return object array: all elements must be objects with a non-empty 'identifier' property`,
    );
  }
};
