import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { CreateDataI, NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { BuildContext } from './build.types';

/**
 * Builds an instance from data.
 * status 'new' means the instance doesn't exist in DB yet
 * status 'existing' means it was loaded from DB
 *
 * Note: `dataValues` contains only schema properties (node data).
 * Relationship configuration data (used for creating related nodes) is stored
 * separately in `__relationshipData` and accessible via getters on the instance.
 */
export function build<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  ctx: BuildContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: CreateDataI<Properties, RelatedNodesToAssociateI>,
  params?: { status?: 'new' | 'existing' },
): NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI> {
  const instance = new ctx.ModelClass() as unknown as NeogmaInstance<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  > &
    Partial<RelatedNodesToAssociateI> & {
      __relationshipData: Partial<RelatedNodesToAssociateI>;
    };

  const status = params?.status || 'new';

  instance.__existsInDatabase = status === 'existing';

  instance.dataValues = {} as Properties;
  instance.changed = {} as Record<keyof Properties, boolean>;

  // Separate storage for relationship data (used during createOne/createMany)
  instance.__relationshipData = {} as Partial<RelatedNodesToAssociateI>;

  // Set up schema property getters/setters (these use dataValues)
  for (const _key of Object.keys(ctx.schema)) {
    const key = _key as keyof Properties;

    // set dataValues using data
    if (Object.hasOwn(data, key)) {
      instance.dataValues[key] = (data as AnyObject)[key as string];
      instance.changed[key] = status === 'new';
    }

    // set the setters and getters for schema keys
    Object.defineProperty(instance, key, {
      get: () => {
        return instance.dataValues[key];
      },
      set: (val) => {
        instance.dataValues[key] = val;
        instance.changed[key] = true;
      },
    });
  }

  // Set up relationship alias getters/setters (these use __relationshipData, not dataValues)
  for (const _key of Object.keys(ctx.relationships)) {
    const key = _key as keyof RelatedNodesToAssociateI;

    // Store relationship data separately from dataValues
    if (Object.hasOwn(data, key)) {
      instance.__relationshipData[key] = (data as AnyObject)[key as string];
    }

    // set the setters and getters for relationship aliases
    Object.defineProperty(instance, key, {
      get: () => {
        return instance.__relationshipData[key];
      },
      set: (val) => {
        instance.__relationshipData[key] = val;
      },
    });
  }

  return instance;
}

/**
 * Builds an instance from a database record.
 * The record must have "properties" and "labels" fields.
 */
export function buildFromRecord<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  ctx: BuildContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  record: { properties: Properties; labels: string[] },
): NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI> {
  if (!record.properties || !record.labels) {
    throw new NeogmaConstraintError(
      'record is missing the "properties" or "labels" field',
      { actual: record },
    );
  }

  const instance = build(
    ctx,
    record.properties as CreateDataI<Properties, RelatedNodesToAssociateI>,
    { status: 'existing' },
  );

  instance.labels = record.labels;

  return instance;
}
