import { NeogmaConstraintError } from '../../Errors';
import { isPlainObject } from '../../utils/object';
import type { NodeForMatchI } from './node.types';
import type {
  RelationshipForCreateObjectI,
  RelationshipForMatchI,
  RelationshipForMatchObjectI,
} from './relationship.types';
import type { RequiredProperties } from './utils.types';

/**
 * Type guard for relationships with a 'where' clause. Returns false for invalid values (side-effect free).
 * Use assertRelationshipWithWhere() if you need validation with error throwing.
 */
export const isRelationshipWithWhere = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<RelationshipForMatchObjectI, 'where'> => {
  if (typeof relationship !== 'object' || relationship === null) {
    return false;
  }
  if (!('where' in relationship)) {
    return false;
  }
  if (relationship.where === undefined) {
    return false;
  }
  return isPlainObject(relationship.where);
};

/**
 * Validates a relationship with 'where' clause and throws if invalid.
 * @throws NeogmaConstraintError if 'where' key exists with a non-object value
 */
export const assertRelationshipWithWhere = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): void => {
  if (
    typeof relationship === 'object' &&
    relationship !== null &&
    'where' in relationship &&
    relationship.where !== undefined &&
    !isPlainObject(relationship.where)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'where' value: expected a plain object, got ${typeof relationship.where}`,
    );
  }
};

/**
 * Type guard for relationships with a 'properties' property. Returns false for invalid values (side-effect free).
 * Use assertRelationshipWithProperties() if you need validation with error throwing.
 */
export const isRelationshipWithProperties = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<
  RelationshipForCreateObjectI,
  'properties'
> => {
  if (typeof relationship !== 'object' || relationship === null) {
    return false;
  }
  if (!('properties' in relationship)) {
    return false;
  }
  if (relationship.properties === undefined) {
    return false;
  }
  return isPlainObject(relationship.properties);
};

/**
 * Validates a relationship with 'properties' property and throws if invalid.
 * @throws NeogmaConstraintError if 'properties' key exists with a non-object value
 */
export const assertRelationshipWithProperties = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): void => {
  if (
    typeof relationship === 'object' &&
    relationship !== null &&
    'properties' in relationship &&
    relationship.properties !== undefined &&
    !isPlainObject(relationship.properties)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'properties' value: expected a plain object, got ${typeof relationship.properties}`,
    );
  }
};

/**
 * Type guard to check if a value is a relationship (has 'direction' property or is a string).
 * Used to distinguish relationships from nodes in related arrays.
 */
export const isRelationship = (
  _relationship: RelationshipForMatchI | NodeForMatchI,
): _relationship is RelationshipForMatchI => {
  return (
    typeof _relationship === 'string' ||
    (typeof _relationship === 'object' &&
      _relationship !== null &&
      'direction' in _relationship)
  );
};
