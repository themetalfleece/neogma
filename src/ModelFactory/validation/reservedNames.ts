import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { assertValidCypherIdentifier } from '../../utils/cypher';

/**
 * Reserved names that could cause prototype pollution if used as object keys.
 * These are blocked across all contexts.
 */
export const PROTOTYPE_POLLUTION_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
] as const;

/**
 * Reserved relationship alias names that conflict with internal keys used
 * in eager loading queries. These cannot be used as relationship aliases.
 */
export const RESERVED_RELATIONSHIP_ALIASES = [
  ...PROTOTYPE_POLLUTION_KEYS,
  'node',
  'relationship',
  '__collected',
] as const;

/**
 * Reserved property names that conflict with internal instance properties
 * and methods. These cannot be used as schema property names.
 */
export const RESERVED_INSTANCE_PROPERTIES = [
  // Prototype pollution protection
  ...PROTOTYPE_POLLUTION_KEYS,
  // Internal state properties
  '__existsInDatabase',
  '__relationshipData',
  'dataValues',
  'changed',
  'labels',
  // Instance methods
  'getDataValues',
  'save',
  'validate',
  'updateRelationship',
  'delete',
  'relateTo',
  'findRelationships',
  'deleteRelationships',
] as const;

// Create Sets for O(1) lookup
const reservedRelationshipAliasSet = new Set<string>(
  RESERVED_RELATIONSHIP_ALIASES,
);
const reservedInstancePropertySet = new Set<string>(
  RESERVED_INSTANCE_PROPERTIES,
);

/**
 * Validates a relationship alias name.
 *
 * Checks that the alias:
 * 1. Is a valid Cypher identifier (alphanumeric + underscore, not starting with number)
 * 2. Is not a reserved name that conflicts with internal keys
 *
 * @param alias - The alias to validate
 * @param modelName - The model name for error messages
 * @throws NeogmaError if the alias is not a valid Cypher identifier
 * @throws NeogmaConstraintError if the alias is a reserved name
 */
export function validateRelationshipAlias(
  alias: string,
  modelName: string,
): void {
  // Validate as Cypher identifier first
  assertValidCypherIdentifier(
    alias,
    `relationship alias in model "${modelName}"`,
  );

  // Check for reserved names
  if (reservedRelationshipAliasSet.has(alias)) {
    throw new NeogmaConstraintError(
      `Relationship alias "${alias}" in model "${modelName}" is reserved. ` +
        `Reserved names: ${RESERVED_RELATIONSHIP_ALIASES.join(', ')}`,
    );
  }
}

/**
 * Validates a schema property name.
 *
 * Checks that the property name is not a reserved name that conflicts with
 * instance properties/methods. Property names that require escaping in Cypher
 * (spaces, dashes, etc.) are allowed - the query builder handles escaping.
 *
 * @param propertyName - The property name to validate
 * @param modelName - The model name for error messages
 * @throws NeogmaConstraintError if the property name is empty or a reserved name
 */
export function validateSchemaPropertyName(
  propertyName: string,
  modelName: string,
): void {
  // Validate non-empty
  if (!propertyName || propertyName.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Schema property name in model "${modelName}" cannot be empty`,
    );
  }

  // Check for reserved names (includes prototype pollution keys)
  if (reservedInstancePropertySet.has(propertyName)) {
    throw new NeogmaConstraintError(
      `Schema property "${propertyName}" in model "${modelName}" is reserved. ` +
        `Reserved names: ${RESERVED_INSTANCE_PROPERTIES.join(', ')}`,
    );
  }
}
