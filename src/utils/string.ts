export const trimWhitespace = (s: string, replaceWith = ' '): string =>
  s.replace(/\s+/g, replaceWith)?.trim();

/**
 * Generates a random alphanumeric suffix suitable for use in identifiers.
 * Unlike Math.random().toString(), this produces dot-free strings safe for
 * property names in Cypher queries.
 *
 * @param length - The length of the suffix (default: 8, max: 32)
 * @returns A random alphanumeric string of exactly the specified length
 */
export const randomSuffix = (length = 8): string =>
  crypto.randomUUID().replace(/-/g, '').slice(0, length);
