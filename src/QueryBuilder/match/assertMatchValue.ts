import { NeogmaConstraintError } from '../../Errors';
import type {
  MatchI,
  MatchLiteralI,
  MatchMultipleI,
  MatchRelatedI,
} from './getMatchString.types';
import {
  isMatchLiteral,
  isMatchMultiple,
  isMatchRelated,
} from './isMatchParameter';

/**
 * Validates a match value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string or object
 */
export const assertMatchValue = (match: MatchI['match']): void => {
  if (typeof match === 'string') {
    if (match.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'match' value: expected a non-empty string`,
      );
    }
    return;
  }
  if (typeof match !== 'object' || match === null || Array.isArray(match)) {
    throw new NeogmaConstraintError(
      `Invalid 'match' value: expected a non-empty string or plain object, got ${Array.isArray(match) ? 'array' : typeof match}`,
    );
  }
};

/**
 * Validates a MatchRelatedI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like MatchRelatedI but is invalid
 */
export const assertMatchRelated = (param: MatchI['match']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'related' in param &&
    !isMatchRelated(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'related' value: expected an array, got ${typeof (param as MatchRelatedI).related}`,
    );
  }
};

/**
 * Validates a MatchMultipleI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like MatchMultipleI but is invalid
 */
export const assertMatchMultiple = (param: MatchI['match']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'multiple' in param &&
    !isMatchMultiple(param)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'multiple' value: expected an array, got ${typeof (param as MatchMultipleI).multiple}`,
    );
  }
};

/**
 * Validates a MatchLiteralI value and throws if invalid.
 * @throws NeogmaConstraintError if param looks like MatchLiteralI but is invalid
 */
export const assertMatchLiteral = (param: MatchI['match']): void => {
  if (
    typeof param === 'object' &&
    param !== null &&
    'literal' in param &&
    !isMatchLiteral(param)
  ) {
    const literal = (param as MatchLiteralI).literal;
    throw new NeogmaConstraintError(
      `Invalid 'literal' value: expected a non-empty string, got ${typeof literal === 'string' ? 'empty string' : typeof literal}`,
    );
  }
};
