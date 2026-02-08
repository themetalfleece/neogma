import type { RawI } from './getRawString.types';

/**
 * Type guard to check if a parameter has a 'raw' key.
 * Only checks for key presence; value validation happens in assertRawValue.
 */
export const isRawParameter = (param: unknown): param is RawI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'raw')
  );
};
