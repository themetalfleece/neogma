export const isEmptyObject = (obj: Record<string, any>): boolean =>
  Object.entries(obj).length === 0 && obj.constructor === Object;

/**
 * Checks if a value is a plain object (not null, not an array, not a primitive).
 * Used by type guards to ensure where/properties values are actual objects.
 * Accepts both regular objects and null-prototype objects (Object.create(null)).
 */
export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  // Accept both Object.prototype and null prototype (Object.create(null))
  return proto === Object.prototype || proto === null;
};
