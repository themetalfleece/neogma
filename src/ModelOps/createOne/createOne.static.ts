import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject } from '../shared.types';
import type {
  CreateDataI,
  CreateDataParamsI,
  NeogmaInstance,
} from '../model.types';
import type { CreateContext } from '../createMany/createMany.types';
import { createMany } from '../createMany';

/**
 * Creates a single node with optional related nodes.
 */
export async function createOne<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  ctx: CreateContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: CreateDataI<Properties, RelatedNodesToAssociateI>,
  configuration?: CreateDataParamsI,
): Promise<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>> {
  const instances = await createMany(ctx, [data], configuration);
  return instances[0];
}
