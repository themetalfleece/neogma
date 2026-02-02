import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { GetDataValuesContext } from './getDataValues.types';

/**
 * Gets the data values from an instance based on schema keys.
 *
 * Returns a **new object** containing only the node's schema properties (e.g., `id`, `name`, `age`).
 * Relationship configuration data (used for creating related nodes) is NOT included.
 *
 * Unlike `instance.dataValues` (which is a direct reference), this returns a shallow copy,
 * making it safe to mutate without affecting the instance's internal state.
 *
 * @param instance - The model instance to extract data values from
 * @param ctx - Context containing the schema keys to filter by
 * @returns A new object containing only the schema property values
 *
 * @example
 * ```ts
 * const user = Users.build({
 *   id: '1',
 *   name: 'John',
 *   Orders: { where: [{ params: { name: 'order1' } }] }
 * });
 *
 * // Returns only schema properties, not relationship data
 * const data = user.getDataValues(); // { id: '1', name: 'John' }
 *
 * // Safe to mutate - doesn't affect the instance
 * data.name = 'changed';
 * console.log(user.name); // Still 'John'
 * ```
 */
export function getDataValues<Properties extends Neo4jSupportedProperties>(
  instance: Properties & { dataValues: Properties },
  ctx: GetDataValuesContext,
): Properties {
  const properties: Properties = ctx.schemaKeys.reduce(
    (acc, key: keyof Properties) => {
      if (instance[key] !== undefined) {
        acc[key] = instance[key];
      }
      return acc;
    },
    {} as Properties,
  );

  return properties;
}
