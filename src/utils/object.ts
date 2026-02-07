export const isEmptyObject = (obj: Record<string, any>): boolean =>
  Object.entries(obj).length === 0 && obj.constructor === Object;

/**
 * Checks if a value is a plain object (not null, not an array, not a primitive).
 * Used by type guards to ensure where/properties values are actual objects.
 */
export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;
