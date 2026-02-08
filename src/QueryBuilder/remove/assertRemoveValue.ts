import { NeogmaConstraintError } from '../../Errors';
import type { RemoveI } from './getRemoveString.types';
import { isRemoveLabels, isRemoveProperties } from './isRemoveParameter';

/**
 * Validates a remove value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertRemoveValue = (remove: RemoveI['remove']): void => {
  if (typeof remove === 'string') {
    if (remove.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'remove' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof remove !== 'object' || remove === null || Array.isArray(remove)) {
    throw new NeogmaConstraintError(
      `Invalid 'remove' value: expected a non-empty string or plain object, got ${Array.isArray(remove) ? 'array' : typeof remove}`,
    );
  }
};

/**
 * Validates a RemovePropertiesI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like RemovePropertiesI but is invalid
 */
export const assertRemoveProperties = (param: RemoveI['remove']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'properties' in param &&
    'identifier' in param &&
    !isRemoveProperties(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid RemoveProperties: 'identifier' must be a non-empty string and 'properties' must be a non-empty string or array of strings`,
    );
  }
};

/**
 * Validates a RemoveLabelsI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like RemoveLabelsI but is invalid
 */
export const assertRemoveLabels = (param: RemoveI['remove']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'labels' in param &&
    'identifier' in param &&
    !isRemoveLabels(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid RemoveLabels: 'identifier' must be a non-empty string and 'labels' must be a non-empty string or array of strings`,
    );
  }
};
