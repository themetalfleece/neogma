import { NeogmaConstraintError } from '../../Errors';
import type { DeleteI } from './getDeleteString.types';
import {
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
} from './isDeleteParameter';

/**
 * Validates a delete value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertDeleteValue = (del: DeleteI['delete']): void => {
  if (typeof del === 'string') {
    if (del.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'delete' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof del !== 'object' || del === null) {
    throw new NeogmaConstraintError(
      `Invalid 'delete' value: expected a non-empty string or object, got ${typeof del}`,
    );
  }
};

/**
 * Validates a DeleteByIdentifierI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like DeleteByIdentifierI but is invalid
 */
export const assertDeleteWithIdentifier = (param: DeleteI['delete']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'identifiers' in param &&
    !isDeleteWithIdentifier(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'identifiers' value: expected a non-empty string or non-empty array of strings`,
    );
  }
};

/**
 * Validates a DeleteLiteralI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like DeleteLiteralI but is invalid
 */
export const assertDeleteWithLiteral = (param: DeleteI['delete']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'literal' in param &&
    !isDeleteWithLiteral(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'literal' value: expected a non-empty string`,
    );
  }
};
