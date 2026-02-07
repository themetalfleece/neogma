import type { Record as Neo4jRecord } from 'neo4j-driver';

import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type {
  EagerLoadedRelationshipEntry,
  FindWithRelationshipsContext,
  RelationshipLevel,
} from './eagerLoading.types';

/**
 * The raw structure returned from Neo4j COLLECT for a relationship.
 */
interface RawCollectedRelationship {
  node: { properties: Record<string, unknown>; labels: string[] } | null;
  relationship: { properties: Record<string, unknown> } | null;
  [nestedAlias: string]: unknown;
}

/**
 * Recursively hydrates nested relationships from collected data.
 */
function hydrateNestedRelationships(
  data: RawCollectedRelationship[],
  level: RelationshipLevel,
): Array<EagerLoadedRelationshipEntry<unknown, unknown>> {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => item.node !== null && item.relationship !== null)
    .map((item) => {
      // Build the target instance using the target model
      const targetInstance = level.targetModel.buildFromRecord(
        item.node as { properties: Record<string, unknown>; labels: string[] },
      );
      targetInstance.__existsInDatabase = true;

      // Recursively hydrate nested relationships
      for (const nested of level.nestedLevels) {
        const nestedData = item[nested.alias] as
          | RawCollectedRelationship[]
          | undefined;
        if (nestedData && Array.isArray(nestedData)) {
          // Set the nested relationships on the target instance
          (targetInstance as Record<string, unknown>)[nested.alias] =
            hydrateNestedRelationships(nestedData, nested);
        }
      }

      return {
        node: targetInstance,
        relationship: item.relationship?.properties ?? {},
      };
    });
}

/**
 * Parameters for hydrating eager load results.
 */
interface HydrateParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  /** The Neo4j record from the query result */
  record: Neo4jRecord;
  /** The identifier used for the root node in the query */
  rootIdentifier: string;
  /** The parsed relationship levels from the query builder */
  relationshipLevels: RelationshipLevel[];
  /** The context for building instances */
  ctx: FindWithRelationshipsContext<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;
}

/**
 * Hydrates a Neo4j record into a Neogma instance with populated relationships.
 *
 * The record is expected to contain:
 * - The root node at rootIdentifier
 * - Each relationship alias containing an array of { node, relationship, ...nested } objects
 */
export function hydrateEagerResult<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  params: HydrateParams<Properties, RelatedNodesToAssociateI, MethodsI>,
): NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI> {
  const { record, rootIdentifier, relationshipLevels, ctx } = params;

  // Build the root instance
  const rootNode = record.get(rootIdentifier) as {
    properties: Properties;
    labels: string[];
  };
  const instance = ctx.buildFromRecord(rootNode);
  instance.__existsInDatabase = true;

  // Populate each relationship alias
  for (const level of relationshipLevels) {
    const collectedData = record.get(level.alias) as RawCollectedRelationship[];

    // Hydrate the relationships for this alias
    const populatedRelationships = hydrateNestedRelationships(
      collectedData,
      level,
    );

    // Set the populated data on the instance using the relationship alias
    // This uses the getter/setter defined in build() for __relationshipData
    (instance as Record<string, unknown>)[level.alias] = populatedRelationships;
  }

  return instance;
}
