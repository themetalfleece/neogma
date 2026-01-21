import revalidator from 'revalidator';
import { NeogmaInstanceValidationError } from '../../Errors/NeogmaInstanceValidationError';
import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject, IValidationSchema } from '../shared.types';
import type { RelationshipsI, NeogmaModel } from '../model.types';
import type { RelationshipConfigContext } from './relationshipConfig.types';

/**
 * Adds more relationship configurations to the Model.
 */
export function addRelationships<RelatedNodesToAssociateI extends AnyObject>(
  ctx: RelationshipConfigContext<RelatedNodesToAssociateI>,
  relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>,
): void {
  for (const key in relationships) {
    ctx.relationships[key] = relationships[key];
  }
}

/**
 * Gets the full relationship configuration for an alias.
 */
export function getRelationshipConfiguration<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipConfigContext<RelatedNodesToAssociateI>,
  alias: Alias,
): Required<RelationshipsI<RelatedNodesToAssociateI>[Alias]> {
  if (!ctx.relationships) {
    throw new NeogmaNotFoundError(
      `Relationship definitions can't be found for the model ${ctx.modelName}`,
    );
  }

  const relationship = ctx.relationships[alias as string];

  if (!relationship) {
    throw new NeogmaNotFoundError(
      `The relationship of the alias ${
        alias as string
      } can't be found for the model ${ctx.modelName}`,
    );
  }

  const returnValue: RelationshipsI<RelatedNodesToAssociateI>[Alias] = {
    model: relationship.model,
    direction: relationship.direction,
    name: relationship.name,
    properties: relationship.properties,
  };

  return returnValue as Required<
    RelationshipsI<RelatedNodesToAssociateI>[Alias]
  >;
}

/**
 * Reverses the configuration of a relationship.
 */
export function reverseRelationshipConfiguration<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipConfigContext<RelatedNodesToAssociateI>,
  alias: Alias,
): RelationshipsI<RelatedNodesToAssociateI>[Alias] {
  const relationship = getRelationshipConfiguration(ctx, alias);

  const reverseDirection = (
    d: (typeof relationship)['direction'],
  ): (typeof relationship)['direction'] => {
    if (d === 'in') {
      return 'out';
    }
    if (d === 'out') {
      return 'in';
    }
    return 'none';
  };

  return {
    model: ctx.Model,
    direction: reverseDirection(relationship.direction),
    name: relationship.name,
    properties: relationship.properties,
  };
}

/**
 * Gets a subset of relationship configuration (name, direction, model).
 */
export function getRelationshipByAlias<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipConfigContext<RelatedNodesToAssociateI>,
  alias: Alias,
): Pick<RelatedNodesToAssociateI[Alias], 'name' | 'direction' | 'model'> {
  const relationshipConfiguration = getRelationshipConfiguration(ctx, alias);

  return {
    model: relationshipConfiguration.model,
    direction: relationshipConfiguration.direction,
    name: relationshipConfiguration.name,
  };
}

/**
 * Returns the relationship properties to be created from the data.
 */
export function getRelationshipProperties(
  relationship: RelationshipsI<any>[0],
  dataToUse: Neo4jSupportedProperties,
  Model: NeogmaModel<any, any, any, any>,
): Neo4jSupportedProperties {
  const keysToUse = Object.keys(relationship.properties || {});
  const relationshipProperties: Neo4jSupportedProperties = {};
  const validationSchema: Record<string, IValidationSchema<AnyObject>> = {};

  for (const key of keysToUse) {
    const property = relationship.properties?.[key]?.property as string;

    if (!property) {
      continue;
    }

    const schema = relationship.properties?.[key]?.schema;

    if (schema) {
      validationSchema[property] = schema;
    }

    if (key in dataToUse) {
      relationshipProperties[property] = dataToUse[key];
    }
  }

  const validationResult = revalidator.validate(relationshipProperties, {
    type: 'object',
    properties: validationSchema,
  });

  if (validationResult.errors.length) {
    throw new NeogmaInstanceValidationError(
      `Could not validate relationship property`,
      {
        model: Model,
        errors: validationResult.errors,
      },
    );
  }

  return relationshipProperties;
}
