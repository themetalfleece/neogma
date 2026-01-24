import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';

/**
 * Safely accesses a property on a NeogmaInstance.
 * This helper provides type-safe access to instance properties that may not be
 * explicitly defined in the type system due to the dynamic nature of the schema.
 *
 * @param instance - The NeogmaInstance to access the property from
 * @param key - The property key to access
 * @returns The value of the property
 */
export function getInstanceProperty<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends Record<string, any>,
  MethodsI extends Record<string, any>,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  key: string,
): unknown {
  return (instance as Record<string, unknown>)[key];
}

/**
 * Safely sets a property on a NeogmaInstance.
 * This helper provides type-safe access to set instance properties that may not be
 * explicitly defined in the type system due to the dynamic nature of the schema.
 *
 * @param instance - The NeogmaInstance to set the property on
 * @param key - The property key to set
 * @param value - The value to set
 */
export function setInstanceProperty<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends Record<string, any>,
  MethodsI extends Record<string, any>,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  key: string,
  value: unknown,
): void {
  (instance as Record<string, unknown>)[key] = value;
}
