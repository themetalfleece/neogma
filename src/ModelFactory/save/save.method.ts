import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { CreateDataI, NeogmaInstance, UpdateDataI } from '../model.types';
import type { AnyObject } from '../shared.types';
import { getInstanceProperty } from '../utils/propertyAccessor';
import type { SaveConfiguration, SaveContext } from './save.types';

/**
 * Saves an instance to the database. If it's new it creates it, and if it already exists it edits it.
 */
export async function save<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  ctx: SaveContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  configuration?: SaveConfiguration,
): Promise<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>> {
  const config: SaveConfiguration = {
    validate: true,
    ...configuration,
  };

  if (instance.__existsInDatabase) {
    if (config.validate) {
      await instance.validate();
    }

    const primaryKeyField = ctx.assertPrimaryKeyField(
      ctx.primaryKeyField,
      'updating via save',
    );

    // if it exists in the database, update the node by only the fields which have changed
    const updateData: Record<string, unknown> = {};
    for (const [key, changed] of Object.entries(instance.changed)) {
      if (changed && ctx.schemaKeys.has(key)) {
        updateData[key] = getInstanceProperty(instance, key);
      }
    }

    const numberOfPropertiesToSet = Object.keys(updateData).length;
    if (numberOfPropertiesToSet) {
      const updateRes = await ctx.Model.update(
        updateData as UpdateDataI<Properties>,
        {
          return: false,
          session: config?.session,
          where: {
            [primaryKeyField]: getInstanceProperty(instance, primaryKeyField),
          },
        },
      );

      const propertiesSet =
        updateRes[1].summary.counters.updates().propertiesSet;

      if (propertiesSet !== numberOfPropertiesToSet) {
        throw new NeogmaConstraintError(
          'Update via save failed, not all properties were updated',
          {
            actual: { propertiesSet },
            expected: { numberOfPropertiesToSet },
          },
        );
      }
    }

    // set all changed to false
    for (const key in instance.changed) {
      if (!Object.hasOwn(instance.changed, key)) {
        continue;
      }
      instance.changed[key as keyof Properties] = false;
    }

    return instance;
  } else {
    // if it's a new one - it doesn't exist in the database yet, need to create it
    // do not validate here, as createOne validates the instance
    return ctx.Model.createOne(
      instance.getDataValues() as CreateDataI<
        Properties,
        RelatedNodesToAssociateI
      >,
      config,
    );
  }
}
