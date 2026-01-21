import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { GetDataValuesContext } from './getDataValues.types';

/**
 * Gets the data values from an instance based on schema keys.
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
