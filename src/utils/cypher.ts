/**
 * Cypher security utilities for preventing injection attacks.
 *
 * This module provides centralized functions for validating and escaping
 * identifiers used in Cypher queries. Use these functions to protect against
 * Cypher injection when handling user-provided input.
 */

import { NeogmaError } from '../Errors/NeogmaError';

/**
 * Validates that a string is a safe Cypher identifier.
 * Safe identifiers contain only alphanumeric characters and underscores,
 * and do not start with a number.
 *
 * Use this function to validate property names, relationship aliases,
 * and other identifiers before using them in queries.
 *
 * @param identifier - The identifier to validate
 * @returns true if the identifier is safe, false otherwise
 *
 * @example
 * ```typescript
 * isValidCypherIdentifier('name')        // true
 * isValidCypherIdentifier('first_name')  // true
 * isValidCypherIdentifier('_private')    // true
 * isValidCypherIdentifier('123abc')      // false (starts with number)
 * isValidCypherIdentifier('my-prop')     // false (contains dash)
 * isValidCypherIdentifier('a; DROP')     // false (contains special chars)
 * ```
 */
export const isValidCypherIdentifier = (identifier: string): boolean => {
  // Must be non-empty, start with letter or underscore, contain only alphanumeric/underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
};

/**
 * Escapes a Cypher identifier by wrapping it in backticks and escaping internal backticks.
 * Use this for labels and relationship types that may contain special characters.
 *
 * Note: This function always escapes, even for valid identifiers. For conditional escaping
 * (only escape if needed), use `escapeIfNeeded()` instead.
 *
 * @param identifier - The identifier to escape
 * @returns The escaped identifier safe for use in Cypher queries
 *
 * @example
 * ```typescript
 * escapeCypherIdentifier('Orders')        // '`Orders`'
 * escapeCypherIdentifier('My Orders')     // '`My Orders`'
 * escapeCypherIdentifier('test`injection') // '`test``injection`'
 * ```
 */
export const escapeCypherIdentifier = (identifier: string): string => {
  // Escape any backticks by doubling them, then wrap in backticks
  return '`' + identifier.replace(/`/g, '``') + '`';
};

/**
 * Escapes a Cypher identifier only if it contains special characters.
 * Returns the original identifier unchanged if it's already valid.
 *
 * Use this for property names, identifiers, and other query parts where
 * you want to preserve the original format for valid identifiers but
 * safely escape invalid ones.
 *
 * @param identifier - The identifier to conditionally escape
 * @returns The original identifier if valid, or escaped with backticks if not
 *
 * @example
 * ```typescript
 * escapeIfNeeded('name')         // 'name' (unchanged - valid)
 * escapeIfNeeded('first_name')   // 'first_name' (unchanged - valid)
 * escapeIfNeeded('my-prop')      // '`my-prop`' (escaped - contains dash)
 * escapeIfNeeded('123abc')       // '`123abc`' (escaped - starts with number)
 * escapeIfNeeded('My Label')     // '`My Label`' (escaped - contains space)
 * escapeIfNeeded('a`b')          // '`a``b`' (escaped - contains backtick)
 * ```
 */
export const escapeIfNeeded = (identifier: string): string =>
  isValidCypherIdentifier(identifier)
    ? identifier
    : escapeCypherIdentifier(identifier);

/**
 * Validates a property name and throws a NeogmaError if invalid.
 * This is a convenience function that combines validation with error throwing.
 *
 * @param property - The property name to validate
 * @param context - Description of where the property is used (for error messages)
 * @throws NeogmaError if the property name is invalid
 *
 * @example
 * ```typescript
 * import { assertValidCypherIdentifier } from './utils/cypher';
 *
 * // In a function that uses property names:
 * assertValidCypherIdentifier(propertyName, 'SET clause');
 * // Throws: Invalid identifier "bad-prop" in SET clause. ...
 * ```
 */
export const assertValidCypherIdentifier = (
  identifier: string,
  context: string,
): void => {
  if (!isValidCypherIdentifier(identifier)) {
    throw new NeogmaError(
      `Invalid identifier "${identifier}" in ${context}. ` +
        `Identifiers must contain only alphanumeric characters and underscores, and cannot start with a number.`,
    );
  }
};

/**
 * Sanitizes a string to be a valid Cypher parameter name.
 * Parameter names must be valid identifiers (alphanumeric + underscore, not starting with number).
 *
 * - Replaces invalid characters with underscores
 * - Prepends underscore if starting with a number
 * - Returns 'param' for empty strings
 *
 * @param name - The string to sanitize
 * @returns A valid Cypher parameter name
 *
 * @example
 * ```typescript
 * sanitizeParamName('name')           // 'name'
 * sanitizeParamName('my-prop')        // 'my_prop'
 * sanitizeParamName('123abc')         // '_123abc'
 * sanitizeParamName('a; DELETE')      // 'a__DELETE'
 * sanitizeParamName('`injection`')    // '_injection_'
 * ```
 */
export const sanitizeParamName = (name: string): string => {
  if (!name) {
    return 'param';
  }

  // Replace all non-alphanumeric/underscore characters with underscores
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');

  // If starts with a number, prepend underscore
  if (/^\d/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }

  // If empty after sanitization (shouldn't happen but be safe)
  if (!sanitized) {
    return 'param';
  }

  return sanitized;
};
