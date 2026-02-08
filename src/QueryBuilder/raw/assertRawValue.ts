import { NeogmaConstraintError } from '../../Errors';
import type { RawI } from './getRawString.types';

/**
 * Validates a raw value and throws if invalid.
 * @throws NeogmaConstraintError if value is not a non-empty string
 */
export const assertRawValue = (raw: RawI['raw']): void => {
  if (typeof raw !== 'string') {
    throw new NeogmaConstraintError(
      `Invalid 'raw' value: expected a non-empty string, got ${typeof raw}`,
    );
  }
  if (raw.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'raw' value: expected a non-empty string, got empty string`,
    );
  }
};
