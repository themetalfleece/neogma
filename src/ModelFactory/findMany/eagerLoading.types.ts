import type { QueryRunner } from '../../QueryRunner';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type { NeogmaInstance, NeogmaModel } from '../model.types';
import type { AnyObject } from '../shared.types';

// ============ Eager Loading Result Types ============

/**
 * A single eager-loaded relationship entry containing the target node instance
 * and the relationship properties.
 */
export interface EagerLoadedRelationshipEntry<
  TargetInstance,
  RelationshipProperties,
> {
  /** The target node instance */
  node: TargetInstance;
  /** The relationship properties */
  relationship: RelationshipProperties;
}

/**
 * An array of eager-loaded relationship entries for a specific alias.
 */
export type EagerLoadedRelationships<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = Array<
  EagerLoadedRelationshipEntry<
    RelatedNodesToAssociateI[Alias]['Instance'],
    RelatedNodesToAssociateI[Alias]['RelationshipProperties']
  >
>;

/**
 * Represents an instance with all potential relationship aliases available as optional properties.
 * Each relationship alias contains an array of { node, relationship } entries.
 * The node entries are recursively typed to include their own relationships.
 *
 * @example
 * ```typescript
 * const users = await Users.findMany({ relationships: { Orders: {} } });
 * const user = users[0] as InstanceWithRelationships<typeof users[0], UsersRelatedNodesI>;
 * // user.Orders is now typed as Array<{ node: OrdersInstance, relationship: { rating: number } }>
 * ```
 */
export type InstanceWithRelationships<
  Instance,
  RelatedNodesToAssociateI extends AnyObject,
> = Instance & {
  [Alias in keyof RelatedNodesToAssociateI]?: Array<
    EagerLoadedRelationshipEntry<
      InstanceWithRelationships<
        RelatedNodesToAssociateI[Alias]['Instance'],
        ExtractRelatedNodesFromInstance<
          RelatedNodesToAssociateI[Alias]['Instance']
        >
      >,
      RelatedNodesToAssociateI[Alias]['RelationshipProperties']
    >
  >;
};

/**
 * Plain object version of an instance with eager-loaded relationships.
 * Used when `plain: true` is specified with relationships.
 */
export type PlainWithRelationships<
  Properties,
  RelatedNodesToAssociateI extends AnyObject,
> = Properties & {
  [Alias in keyof RelatedNodesToAssociateI]?: Array<
    EagerLoadedRelationshipEntry<
      PlainWithRelationships<
        ExtractPropertiesFromInstance<
          RelatedNodesToAssociateI[Alias]['Instance']
        >,
        ExtractRelatedNodesFromInstance<
          RelatedNodesToAssociateI[Alias]['Instance']
        >
      >,
      RelatedNodesToAssociateI[Alias]['RelationshipProperties']
    >
  >;
};

/**
 * Return type for findMany with relationships.
 * Returns plain objects when `Plain` is true, otherwise returns instances with relationships.
 */
export type FindManyWithRelationshipsResult<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean,
> = Plain extends true
  ? Array<PlainWithRelationships<Properties, RelatedNodesToAssociateI>>
  : Array<
      InstanceWithRelationships<
        NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
        RelatedNodesToAssociateI
      >
    >;

// ============ Relationship Load Configuration Types ============

/**
 * Extracts the related nodes type from a NeogmaInstance.
 * Used to get the nested relationships type for recursive configuration.
 */
export type ExtractRelatedNodesFromInstance<T> =
  T extends NeogmaInstance<infer _P, infer R, infer _M> ? R : never;

/**
 * Configuration for loading a single relationship in eager loading.
 * Supports filtering, ordering, pagination, and nested relationships.
 */
export interface RelationshipLoadConfig<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> {
  /**
   * WHERE clause for filtering target nodes and/or relationship properties.
   */
  where?: {
    /** Filter conditions for the target nodes */
    target?: WhereParamsI<
      ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
    >;
    /** Filter conditions for the relationship properties */
    relationship?: WhereParamsI<
      RelatedNodesToAssociateI[Alias]['RelationshipProperties']
    >;
  };

  /**
   * Order the results by target node or relationship properties.
   */
  order?: Array<
    | {
        on: 'target';
        property: Extract<
          keyof ExtractPropertiesFromInstance<
            RelatedNodesToAssociateI[Alias]['Instance']
          >,
          string
        >;
        direction: 'ASC' | 'DESC';
      }
    | {
        on: 'relationship';
        property: Extract<
          keyof RelatedNodesToAssociateI[Alias]['RelationshipProperties'],
          string
        >;
        direction: 'ASC' | 'DESC';
      }
  >;

  /** Maximum number of related nodes to return */
  limit?: number;

  /** Number of related nodes to skip */
  skip?: number;

  /**
   * Nested relationships to eagerly load from the target nodes.
   * Only available if the target model has relationships defined.
   */
  relationships?: RelationshipsLoadConfig<
    ExtractRelatedNodesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
  >;
}

/**
 * Configuration object mapping relationship aliases to their load configs.
 * Each key is a relationship alias defined on the model.
 */
export type RelationshipsLoadConfig<
  RelatedNodesToAssociateI extends AnyObject,
> = {
  [Alias in keyof RelatedNodesToAssociateI]?: RelationshipLoadConfig<
    RelatedNodesToAssociateI,
    Alias
  >;
};

// ============ Context Types ============

/**
 * Context required for the eager loading operation.
 */
export interface FindWithRelationshipsContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  queryRunner: QueryRunner;
  modelName: string;
  getLabel: () => string;
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
  getRelationshipByAlias: <Alias extends keyof RelatedNodesToAssociateI>(
    alias: Alias,
  ) => {
    name: string;
    direction: 'in' | 'out' | 'none';
    model: NeogmaModel<any, any, any, any> | 'self';
  };
  getRelationshipModel: (
    model: NeogmaModel<any, any, any, any> | 'self',
  ) => NeogmaModel<any, any, any, any>;
}

// ============ Internal Query Building Types ============

/**
 * Internal representation of a relationship level for query building.
 */
export interface RelationshipLevel {
  /** The alias name for this relationship (e.g., 'Orders') */
  alias: string;
  /** The Neo4j relationship type name (e.g., 'CREATES') */
  relationshipName: string;
  /** The direction of the relationship */
  direction: 'in' | 'out' | 'none';
  /** The label of the target nodes */
  targetLabel: string;
  /** Identifier for the target node in the query */
  targetIdentifier: string;
  /** Identifier for the relationship in the query */
  relationshipIdentifier: string;
  /** WHERE clause configuration */
  where?: {
    target?: WhereParamsI;
    relationship?: WhereParamsI;
  };
  /** ORDER BY configuration */
  order?: Array<{
    on: 'target' | 'relationship';
    property: string;
    direction: 'ASC' | 'DESC';
  }>;
  /** LIMIT value */
  limit?: number;
  /** SKIP value */
  skip?: number;
  /** Nested relationship levels */
  nestedLevels: RelationshipLevel[];
  /** The target model for building instances */
  targetModel: NeogmaModel<any, any, any, any>;
}

/**
 * Result of building the eager load query.
 */
export interface EagerLoadQueryResult {
  /** The Cypher query statement */
  statement: string;
  /** The bind parameters */
  bindParams: Record<string, unknown>;
  /** Identifiers to return from the query */
  returnIdentifiers: string[];
  /** The parsed relationship levels for hydration */
  relationshipLevels: RelationshipLevel[];
}
