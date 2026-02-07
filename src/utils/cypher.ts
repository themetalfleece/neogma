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
 * Checks if an identifier is already properly escaped with backticks.
 * A properly escaped identifier starts and ends with a backtick, and any
 * internal backticks are doubled (the Cypher escape sequence for backticks).
 *
 * @param identifier - The identifier to check
 * @returns true if the identifier is already properly escaped, false otherwise
 *
 * @example
 * ```typescript
 * isAlreadyEscaped('`Person`')     // true - properly escaped
 * isAlreadyEscaped('`My Label`')   // true - properly escaped
 * isAlreadyEscaped('`a``b`')       // true - internal backtick is doubled
 * isAlreadyEscaped('Person')       // false - not escaped
 * isAlreadyEscaped('`incomplete')  // false - missing closing backtick
 * ```
 */
export const isAlreadyEscaped = (identifier: string): boolean => {
  // Pattern: starts with `, ends with `, contains only doubled backticks or non-backtick chars
  // This ensures internal backticks are properly escaped (doubled)
  return /^`(?:``|[^`])*`$/.test(identifier);
};

/**
 * Escapes a Cypher identifier only if it contains special characters.
 * Returns the original identifier unchanged if it's already valid.
 *
 * Use this for property names, variable identifiers, and other query parts
 * that are never pre-escaped.
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
 * Checks if a string is a multi-label sequence from getNormalizedLabels/getLabel.
 * Multi-label strings are backtick-escaped labels joined by ":" or "|".
 * Examples: "`A`:`B`", "`Label One`|`Label Two`"
 */
const isMultiLabelSequence = (str: string): boolean => {
  // Pattern: sequence of backtick-escaped labels joined by : or |
  // Each label is `...` where internal backticks are doubled
  const escapedLabelPattern = '`(?:``|[^`])*`';
  const multiLabelPattern = new RegExp(
    `^${escapedLabelPattern}(?:[:|]${escapedLabelPattern})+$`,
  );
  return multiLabelPattern.test(str);
};

/**
 * Escapes a label/relationship type if needed, handling both raw and pre-escaped values.
 *
 * This function is idempotent - it works correctly whether you pass:
 * - A raw label like "Person" or "My Label"
 * - A pre-escaped label from `getLabel()` like "`Person`" or "`My Label`"
 * - A multi-label string from `getNormalizedLabels()` like "`A`:`B`"
 *
 * Use this for labels that may come from either user input or from `getLabel()`.
 *
 * @param label - The label to conditionally escape (can be raw or pre-escaped)
 * @returns The properly escaped label
 *
 * @example
 * ```typescript
 * // Raw labels are escaped if needed
 * escapeLabelIfNeeded('Person')      // 'Person' (unchanged - valid)
 * escapeLabelIfNeeded('My Label')    // '`My Label`' (escaped - contains space)
 *
 * // Pre-escaped labels are returned unchanged (no double-escaping)
 * escapeLabelIfNeeded('`Person`')    // '`Person`' (unchanged - already escaped)
 * escapeLabelIfNeeded('`My Label`')  // '`My Label`' (unchanged - already escaped)
 *
 * // Multi-label strings from getLabel() are returned unchanged
 * escapeLabelIfNeeded('`A`:`B`')     // '`A`:`B`' (unchanged - multi-label)
 * ```
 */
export const escapeLabelIfNeeded = (label: string): string => {
  // Already properly escaped single label - return as-is
  if (isAlreadyEscaped(label)) {
    return label;
  }
  // Multi-label sequence from getNormalizedLabels - return as-is
  if (isMultiLabelSequence(label)) {
    return label;
  }
  // Valid identifier - no escaping needed
  if (isValidCypherIdentifier(label)) {
    return label;
  }
  // Needs escaping
  return escapeCypherIdentifier(label);
};

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
