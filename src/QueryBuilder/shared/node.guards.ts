import { NeogmaConstraintError } from '../../Errors';
import { isPlainObject } from '../../utils/object';
import type {
  NodeForCreateObjectI,
  NodeForCreateWithLabelI,
  NodeForCreateWithModelI,
  NodeForMatchObjectI,
} from './node.types';
import type { RequiredProperties } from './utils.types';

/**
 * Type guard for nodes with a 'where' clause. Returns false for invalid values (side-effect free).
 * Use assertNodeWithWhere() if you need validation with error throwing.
 */
export const isNodeWithWhere = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForMatchObjectI, 'where'> => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('where' in node)) {
    return false;
  }
  if (node.where === undefined) {
    return false;
  }
  return isPlainObject(node.where);
};

/**
 * Validates a node with 'where' clause and throws if invalid.
 * @throws NeogmaConstraintError if 'where' key exists with a non-object value
 */
export const assertNodeWithWhere = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): void => {
  if (
    typeof node === 'object' &&
    node !== null &&
    'where' in node &&
    node.where !== undefined &&
    !isPlainObject(node.where)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'where' value: expected a plain object, got ${typeof node.where}`,
    );
  }
};

/**
 * Type guard for nodes with a 'label' property. Returns false for invalid values (side-effect free).
 * Use assertNodeWithLabel() if you need validation with error throwing.
 */
export const isNodeWithLabel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithLabelI => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('label' in node)) {
    return false;
  }
  const label = (node as NodeForCreateWithLabelI).label;
  return typeof label === 'string' && label.trim().length > 0;
};

/**
 * Validates a node with 'label' property and throws if invalid.
 * @throws NeogmaConstraintError if 'label' key exists but is not a non-empty string
 */
export const assertNodeWithLabel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): void => {
  if (
    typeof node === 'object' &&
    node !== null &&
    'label' in node &&
    !isNodeWithLabel(node)
  ) {
    const label = (node as NodeForCreateWithLabelI).label;
    throw new NeogmaConstraintError(
      `Invalid 'label' value: expected a non-empty string, got ${typeof label === 'string' ? 'empty string' : typeof label}`,
    );
  }
};

/**
 * Type guard for nodes with a 'model' property. Returns false for invalid values (side-effect free).
 * Use assertNodeWithModel() if you need validation with error throwing.
 */
export const isNodeWithModel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithModelI => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('model' in node)) {
    return false;
  }
  return node.model !== null && node.model !== undefined;
};

/**
 * Validates a node with 'model' property and throws if invalid.
 * @throws NeogmaConstraintError if 'model' key exists but is null/undefined
 */
export const assertNodeWithModel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): void => {
  if (
    typeof node === 'object' &&
    node !== null &&
    'model' in node &&
    (node.model === null || node.model === undefined)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'model' value: expected a NeogmaModel, got ${node.model}`,
    );
  }
};

/**
 * Type guard for nodes with a 'properties' property. Returns false for invalid values (side-effect free).
 * Use assertNodeWithProperties() if you need validation with error throwing.
 */
export const isNodeWithProperties = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForCreateObjectI, 'properties'> => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('properties' in node)) {
    return false;
  }
  if (node.properties === undefined) {
    return false;
  }
  return isPlainObject(node.properties);
};

/**
 * Validates a node with 'properties' property and throws if invalid.
 * @throws NeogmaConstraintError if 'properties' key exists with a non-object value
 */
export const assertNodeWithProperties = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): void => {
  if (
    typeof node === 'object' &&
    node !== null &&
    'properties' in node &&
    node.properties !== undefined &&
    !isPlainObject(node.properties)
  ) {
    throw new NeogmaConstraintError(
      `Invalid 'properties' value: expected a plain object, got ${typeof node.properties}`,
    );
  }
};
