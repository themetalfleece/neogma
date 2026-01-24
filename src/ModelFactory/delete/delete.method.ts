import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import { getInstanceProperty } from '../utils/propertyAccessor';
import type {
  InstanceDeleteConfiguration,
  InstanceDeleteContext,
} from './delete.types';

/**
 * Deletes the instance from the database.
 */
export async function deleteInstance<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends Record<string, any>,
  MethodsI extends Record<string, any>,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  ctx: InstanceDeleteContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  configuration?: InstanceDeleteConfiguration,
): Promise<number> {
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'delete',
  );

  // Call beforeDelete hook if it exists
  await (
    ctx.Model as unknown as {
      beforeDelete?: (
        instance: NeogmaInstance<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI
        >,
      ) => Promise<void>;
    }
  ).beforeDelete?.(instance);

  return ctx.Model.delete({
    ...configuration,
    where: {
      [primaryKeyField]: getInstanceProperty(instance, primaryKeyField),
    },
  });
}
