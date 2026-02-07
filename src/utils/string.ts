import { randomUUID } from 'crypto';

export const trimWhitespace = (s: string, replaceWith = ' '): string =>
  s.replace(/\s+/g, replaceWith)?.trim();

/**
 * Generates a random alphanumeric suffix suitable for use in identifiers.
 * Unlike Math.random().toString(), this produces dot-free strings safe for
 * property names in Cypher queries.
 *
 * @param length - The length of the suffix (default: 8, clamped to 1-32)
 * @returns A random alphanumeric string of exactly the specified length
 */
export const randomSuffix = (length = 8): string => {
  const clampedLength = Math.max(1, Math.min(32, length));
  return randomUUID().replace(/-/g, '').slice(0, clampedLength);
};

/**
 * Validates that a string is a safe Cypher identifier.
 * Safe identifiers contain only alphanumeric characters and underscores,
 * and do not start with a number.
 *
 * @param identifier - The identifier to validate
 * @returns true if the identifier is safe, false otherwise
 */
export const isValidCypherIdentifier = (identifier: string): boolean => {
  // Must be non-empty, start with letter or underscore, contain only alphanumeric/underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
};

/**
 * Escapes a Cypher identifier by wrapping it in backticks and escaping internal backticks.
 * Use this for user-provided identifiers that may contain special characters.
 *
 * @param identifier - The identifier to escape
 * @returns The escaped identifier safe for use in Cypher queries
 *
 * @example
 * escapeCypherIdentifier('Orders') // Returns '`Orders`'
 * escapeCypherIdentifier('My Orders') // Returns '`My Orders`'
 * escapeCypherIdentifier('test`injection') // Returns '`test``injection`'
 */
export const escapeCypherIdentifier = (identifier: string): string => {
  // Escape any backticks by doubling them, then wrap in backticks
  return '`' + identifier.replace(/`/g, '``') + '`';
};
