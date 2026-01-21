import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import type { NeogmaModel } from '../model.types';

/**
 * Asserts that the given primaryKeyField exists.
 * @throws NeogmaConstraintError if primaryKeyField is not defined
 */
export function assertPrimaryKeyField(
  primaryKeyField: string | undefined,
  operation: string,
): string {
  if (!primaryKeyField) {
    throw new NeogmaConstraintError(
      `This operation (${operation}) required the model to have a primaryKeyField`,
    );
  }
  return primaryKeyField;
}

/**
 * Gets the label from the given model for a relationship.
 * If relationshipModel is 'self', returns the current model's label.
 */
export function getLabelFromRelationshipModel(
  currentModel: NeogmaModel<any, any, any, any>,
  relationshipModel: NeogmaModel<any, any, object, object> | 'self',
): string {
  return relationshipModel === 'self'
    ? currentModel.getLabel()
    : relationshipModel.getLabel();
}

/**
 * Gets the model of a relationship.
 * If relationshipModel is 'self', returns the current model.
 */
export function getRelationshipModel(
  currentModel: NeogmaModel<any, any, any, any>,
  relationshipModel: NeogmaModel<any, any, object, object> | 'self',
): NeogmaModel<any, any, object, object> {
  return relationshipModel === 'self' ? currentModel : relationshipModel;
}
