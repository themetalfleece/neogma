import type {
  ReturnElementI,
  ReturnI,
  ReturnObjectI,
} from './getReturnString.types';

/**
 * Type guard for ReturnI. Checks if param has a 'return' key.
 * Value validation happens in getReturnString via assertReturnValue.
 */
export const isReturnParameter = (param: unknown): param is ReturnI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'return')
  );
};

/**
 * Type guard helper for a valid return element (string or object with identifier).
 */
export const isValidReturnElement = (item: unknown): item is ReturnElementI => {
  if (typeof item === 'string') {
    return item.trim().length > 0;
  }
  if (typeof item === 'object' && item !== null) {
    const identifier = (item as { identifier: string }).identifier;
    return typeof identifier === 'string' && identifier.trim().length > 0;
  }
  return false;
};

/**
 * Type guard for ReturnObjectI (array of objects with identifier). Returns false for invalid values (side-effect free).
 * Use assertReturnObject() if you need validation with error throwing.
 */
export const isReturnObject = (
  param: ReturnI['return'],
): param is ReturnObjectI => {
  if (!Array.isArray(param)) {
    return false;
  }
  for (const item of param) {
    if (typeof item === 'string') {
      // String items are valid for mixed arrays, not ReturnObjectI (all objects)
      return false;
    }
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const identifier = (item as ReturnObjectI[0]).identifier;
    if (typeof identifier !== 'string' || identifier.trim().length === 0) {
      return false;
    }
  }
  return true;
};
