import { NeogmaConstraintError } from '../../Errors';
import type {
  CreateI,
  CreateMultipleI,
  CreateRelatedI,
  MergeI,
} from './getCreateOrMergeString.types';
import { isCreateMultiple, isCreateRelated } from './isCreateOrMergeParameter';

/**
 * Validates a create value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertCreateValue = (create: CreateI['create']): void => {
  if (typeof create === 'string') {
    if (create.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'create' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof create !== 'object' || create === null) {
    throw new NeogmaConstraintError(
      `Invalid 'create' value: expected a non-empty string or object, got ${typeof create}`,
    );
  }
};

/**
 * Validates a merge value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertMergeValue = (merge: MergeI['merge']): void => {
  if (typeof merge === 'string') {
    if (merge.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'merge' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof merge !== 'object' || merge === null) {
    throw new NeogmaConstraintError(
      `Invalid 'merge' value: expected a non-empty string or object, got ${typeof merge}`,
    );
  }
};

/**
 * Validates a CreateRelatedI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like CreateRelatedI but is invalid
 */
export const assertCreateRelated = (param: CreateI['create']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'related' in param &&
    !isCreateRelated(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'related' value: expected an array, got ${typeof (param as CreateRelatedI).related}`,
    );
  }
};

/**
 * Validates a CreateMultipleI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like CreateMultipleI but is invalid
 */
export const assertCreateMultiple = (param: CreateI['create']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'multiple' in param &&
    !isCreateMultiple(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'multiple' value: expected an array, got ${typeof (param as CreateMultipleI).multiple}`,
    );
  }
};
