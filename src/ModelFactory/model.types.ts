import type { QueryResult } from 'neo4j-driver';

import type { QueryBuilder } from '../QueryBuilder';
import type { Neo4jSupportedProperties } from '../QueryRunner';
import type { CreateRelationshipParamsI } from '../QueryRunner';
import type { ExtractPropertiesFromInstance, WhereParamsI } from '../Where';
import type { DeleteRelationshipsWhereClause } from './deleteRelationships/deleteRelationships.types';
import type {
  InstanceWithRelationships,
  PlainWithRelationships,
  RelationshipsLoadConfig,
} from './findMany/eagerLoading.types';
import type {
  FindRelationshipsWhereClause,
  InstanceFindRelationshipsWhereClause,
} from './findRelationships/findRelationships.types';
import type { RelateToWhereClause } from './relateTo/relateTo.types';
import type {
  RelatedNodesCreationParamI,
  RelationshipPropertiesI,
} from './relationship.types';
import type {
  AnyObject,
  GenericConfiguration,
  IValidationSchema,
} from './shared.types';
import type {
  InstanceUpdateRelationshipWhereClause,
  UpdateRelationshipData,
  UpdateRelationshipWhereClause,
} from './updateRelationship/updateRelationship.types';

// ============ Relationship Types (defined here to avoid circular deps) ============

/** used for defining the type of the RelatedNodesToAssociate interface, to be passed as the second generic to ModelFactory */
export interface ModelRelatedNodesI<
  /** the type of the related model */
  RelatedModel extends {
    createOne: NeogmaModelStaticsI<any>['createOne'];
  },
  /** the instance of the related model */
  RelatedInstance,
  /** properties for the relationship */
  CreateRelationshipProperties extends RelationshipPropertiesI | object =
    object,
  RelationshipProperties extends RelationshipPropertiesI | object = object,
> {
  /** interface of the data to create */
  CreateData: Parameters<RelatedModel['createOne']>[0] &
    Partial<CreateRelationshipProperties>;
  /** interface of the properties of the relationship used in create functions */
  CreateRelationshipProperties: CreateRelationshipProperties;
  /** interface of the actual properties of the relationship */
  RelationshipProperties: RelationshipProperties;
  /** the instance of the related model */
  Instance: RelatedInstance;
}

/** the type for the Relationship configuration of a Model */
export type RelationshipsI<RelatedNodesToAssociateI extends AnyObject> = {
  /** the alias of the relationship definitions is the key */
  [alias in keyof RelatedNodesToAssociateI]: {
    /** the related model. It could be the object of the model, or "self" for this model */
    model: NeogmaModel<any, any, any, any> | 'self';
    /** the name of the relationship */
    name: CreateRelationshipParamsI['relationship']['name'];
    /** the direction of the relationship */
    direction: 'out' | 'in' | 'none';
    /** relationship properties */
    properties?: {
      /** the alias of the relationship property is the key */
      [relationshipPropertyAlias in keyof RelatedNodesToAssociateI[alias]['CreateRelationshipProperties']]: {
        /** the actual property to be used on the relationship */
        property: keyof RelatedNodesToAssociateI[alias]['RelationshipProperties'];
        /** validation for the property */
        schema: IValidationSchema;
      };
    };
  };
};

// ============ Create Types ============

/** parameters when creating nodes */
export type CreateDataParamsI = GenericConfiguration & {
  /** whether to merge instead of creating */
  merge?: boolean;
  /** validate all parent and children instances. default to true */
  validate?: boolean;
  /** the relationships which were created by a "where" param must equal to this number */
  assertRelationshipsOfWhere?: number;
};

/** type used for creating nodes. It includes their Properties and Related Nodes */
export type CreateDataI<
  Properties,
  RelatedNodesToAssociateI extends AnyObject,
> = Properties & Partial<RelatedNodesCreationParamI<RelatedNodesToAssociateI>>;

// ============ Update Types ============

import type { UpdateTypes } from '../QueryRunner';

export type UpdateDataI<Properties> = {
  [K in keyof Properties]?: undefined extends Properties[K]
    ? Properties[K] | UpdateTypes['Remove'] // Allow property removal only if property is optional
    : Properties[K];
};

// ============ Find Types ============

export type FindManyIncludeI<AliasKeys> = {
  alias: AliasKeys;
  /** where params for the nodes of the included Model */
  where?: WhereParamsI;
  /** default false */
  optional?: boolean;
  include?: FindManyIncludeI<any>;
};

// ============ Model Statics Interface ============

/** the statics of a Neogma Model */
export interface NeogmaModelStaticsI<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject = object,
  MethodsI extends AnyObject = object,
  CreateData = CreateDataI<Properties, RelatedNodesToAssociateI>,
  UpdateData = UpdateDataI<Properties>,
  Instance = NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
> {
  prototype: MethodsI;
  relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
  addRelationships: (
    relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>,
  ) => void;
  getLabel: (
    operation?: Parameters<typeof QueryBuilder.getNormalizedLabels>[1],
  ) => string;
  getRawLabels: () => string[];
  getPrimaryKeyField: () => string | null;
  getModelName: () => string;
  beforeCreate: (instance: Instance) => void;
  beforeDelete: (instance: Instance) => void;
  /**
   * builds data Instance by data, setting information fields appropriately
   * status 'new' can be called publicly (hence the .build wrapper), but 'existing' should be used only internally when building instances after finding nodes from the database
   */
  build: (
    data: CreateData,
    params?: {
      status?: 'new' | 'existing';
    },
  ) => Instance;
  /** builds an instance from a database record. It needs to correspond to a node, by having a "properties" and "labels" field */
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => Instance;
  createOne: (
    data: CreateData,
    configuration?: CreateDataParamsI,
  ) => Promise<Instance>;
  createMany: (
    data: CreateData[],
    configuration?: CreateDataParamsI,
  ) => Promise<Instance[]>;
  getRelationshipConfiguration: <Alias extends keyof RelatedNodesToAssociateI>(
    alias: Alias,
  ) => Required<RelationshipsI<RelatedNodesToAssociateI>[Alias]>;
  getRelationshipByAlias: <Alias extends keyof RelatedNodesToAssociateI>(
    alias: Alias,
  ) => Pick<RelatedNodesToAssociateI[Alias], 'name' | 'direction' | 'model'>;
  reverseRelationshipConfiguration: <
    Alias extends keyof RelatedNodesToAssociateI,
  >(
    alias: Alias,
  ) => RelationshipsI<RelatedNodesToAssociateI>[Alias];
  update: <Return extends boolean = false>(
    data: UpdateData,
    params?: GenericConfiguration & {
      where?: WhereParamsI<Properties>;
      /**
       * When true, the first element of the returned tuple contains the updated instances.
       * When false (default), the first element is an empty array.
       */
      return?: Return;
    },
  ) => Promise<
    Return extends true ? [Instance[], QueryResult] : [[], QueryResult]
  >;
  updateRelationship: <
    Alias extends keyof RelatedNodesToAssociateI,
    Return extends boolean = false,
  >(
    data: UpdateRelationshipData<RelatedNodesToAssociateI, Alias>,
    params: {
      alias: Alias;
      where?: UpdateRelationshipWhereClause<
        Properties,
        RelatedNodesToAssociateI,
        Alias
      >;
      /**
       * When true, the first element of the returned tuple contains the updated relationships.
       * When false (default), the first element is an empty array.
       */
      return?: Return;
      /** When true, throws NeogmaNotFoundError if no relationships were updated. */
      throwIfNoneUpdated?: boolean;
      session?: GenericConfiguration['session'];
    },
  ) => Promise<
    Return extends true
      ? [
          Array<{
            source: Instance;
            target: RelatedNodesToAssociateI[Alias]['Instance'];
            relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
          }>,
          QueryResult,
        ]
      : [[], QueryResult]
  >;
  /** returns the relationship properties to be created, from the data in dataToUse (with the alias as a key) */
  getRelationshipProperties: (
    relationship: RelationshipsI<any>[0],
    dataToUse: Neo4jSupportedProperties,
  ) => Neo4jSupportedProperties;
  delete: (
    configuration?: GenericConfiguration & {
      detach?: boolean;
      where: WhereParamsI<Properties>;
    },
  ) => Promise<number>;
  findMany: <Plain extends boolean = false>(
    params?: GenericConfiguration & {
      /** where params for the nodes of this Model */
      where?: WhereParamsI<Properties>;
      limit?: number;
      skip?: number;
      order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
      /**
       * Returns an array of the plain properties, instead of Instances.
       * When `relationships` is provided, includes them on each plain object.
       */
      plain?: Plain;
      /** throws an error if no nodes are found (results length 0) */
      throwIfNoneFound?: boolean;
      /**
       * Relationships to eagerly load with the results.
       * Each key is a relationship alias defined on the model.
       */
      relationships?: RelationshipsLoadConfig<RelatedNodesToAssociateI>;
    },
  ) => Promise<
    Plain extends true
      ? Array<PlainWithRelationships<Properties, RelatedNodesToAssociateI>>
      : Array<InstanceWithRelationships<Instance, RelatedNodesToAssociateI>>
  >;
  findOne: <Plain extends boolean = false>(
    params?: GenericConfiguration & {
      /** where params for the nodes of this Model */
      where?: WhereParamsI<Properties>;
      order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
      /**
       * Returns the plain properties of the result, instead of an Instance.
       * When `relationships` is provided, includes them on the plain object.
       */
      plain?: Plain;
      /** throws an error if the node is not found */
      throwIfNotFound?: boolean;
      /**
       * Relationships to eagerly load with the result.
       * Each key is a relationship alias defined on the model.
       */
      relationships?: RelationshipsLoadConfig<RelatedNodesToAssociateI>;
    },
  ) => Promise<
    | (Plain extends true
        ? PlainWithRelationships<Properties, RelatedNodesToAssociateI>
        : InstanceWithRelationships<Instance, RelatedNodesToAssociateI>)
    | null
  >;
  createRelationship: (
    params: CreateRelationshipParamsI & {
      /** throws an error if the number of created relationships don't equal to this number */
      assertCreatedRelationships?: number;
    },
  ) => Promise<number>;
  getLabelFromRelationshipModel: (
    relationshipModel: NeogmaModel<any, any, object, object> | 'self',
  ) => string;
  getRelationshipModel: (
    relationshipModel: NeogmaModel<any, any, object, object> | 'self',
  ) => NeogmaModel<any, any, object, object>;
  /** asserts that the given primaryKeyField exists. Also returns it for typescript purposes */
  assertPrimaryKeyField: (
    primaryKeyField: string | undefined,
    operation: string,
  ) => string;
  relateTo: <
    Alias extends keyof RelatedNodesToAssociateI,
    Return extends boolean = false,
  >(params: {
    alias: Alias;
    where: RelateToWhereClause<Properties, RelatedNodesToAssociateI, Alias>;
    properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
    /** throws an error if the number of created relationships don't equal to this number */
    assertCreatedRelationships?: number;
    /**
     * When true, the first element of the returned tuple contains the created relationships.
     * When false (default), the first element is an empty array.
     */
    return?: Return;
    /** When true, throws NeogmaNotFoundError if no relationships were created. */
    throwIfNoneCreated?: boolean;
    session?: GenericConfiguration['session'];
  }) => Promise<
    Return extends true
      ? [
          Array<{
            source: Instance;
            target: RelatedNodesToAssociateI[Alias]['Instance'];
            relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
          }>,
          number,
        ]
      : [[], number]
  >;
  findRelationships: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where?: FindRelationshipsWhereClause<
      Properties,
      RelatedNodesToAssociateI,
      Alias
    >;
    /** a limit to apply to the fetched relationships */
    limit?: number;
    /** skip the first n relationships */
    skip?: number;
    /** variable length relationship: minimum hops */
    minHops?: number;
    /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
    maxHops?: number;
    /** When true, throws NeogmaNotFoundError if no relationships are found. */
    throwIfNoneFound?: boolean;
    session?: GenericConfiguration['session'];
    /** order the results */
    order?: Array<
      | {
          on: 'source';
          property: Extract<keyof Properties, string>;
          direction: 'ASC' | 'DESC';
        }
      | {
          on: 'target';
          property: Extract<
            keyof RelatedNodesToAssociateI[Alias]['Instance'],
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
  }) => Promise<
    Array<{
      source: Instance;
      target: RelatedNodesToAssociateI[Alias]['Instance'];
      relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
    }>
  >;
  /**
   * returns the count of the deleted relationships
   */
  deleteRelationships: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where: DeleteRelationshipsWhereClause<
      Properties,
      RelatedNodesToAssociateI,
      Alias
    >;
    /** When true, throws NeogmaNotFoundError if no relationships were deleted. */
    throwIfNoneDeleted?: boolean;
    session?: GenericConfiguration['session'];
  }) => Promise<number>;
}

// ============ Instance Methods Interface ============

/** the methods of a Neogma Instance */
export interface NeogmaInstanceMethodsI<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Instance = NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
> {
  /**
   * Indicates whether this instance represents a node that exists in the database.
   *
   * - `true`: The instance was loaded from the database (via `findOne`, `findMany`, `buildFromRecord`,
   *   or `build` with `{ status: 'existing' }`). Calling `save()` will UPDATE the existing node.
   * - `false`: The instance is new and doesn't exist in the database yet. Calling `save()` will
   *   CREATE a new node.
   *
   * This flag is set automatically by Neogma and should not be modified directly.
   */
  __existsInDatabase: boolean;
  /**
   * Direct reference to the internal object containing schema properties (node data).
   * Does not include relationship configuration data.
   *
   * **Warning**: Mutating this object directly (e.g., `instance.dataValues.name = 'foo'`)
   * will modify the instance's internal state. Use `getDataValues()` if you need a safe copy.
   *
   * @see {@link getDataValues} for a safe copy that won't affect the instance.
   */
  dataValues: Properties;
  /**
   * Tracks which schema properties have been modified since the instance was built or last saved.
   *
   * - For new instances (`__existsInDatabase: false`): All provided properties are marked as changed.
   * - For existing instances (`__existsInDatabase: true`): Properties start as unchanged (`false`)
   *   and are marked `true` when modified via setters.
   *
   * Used by `save()` to determine which properties need to be updated in the database.
   */
  changed: Record<keyof Properties, boolean>;
  /**
   * Internal storage for relationship configuration data.
   * Used during createOne/createMany for creating related nodes.
   * Access relationship data via the relationship alias getters on the instance.
   */
  __relationshipData: Partial<RelatedNodesToAssociateI>;
  /**
   * The Neo4j labels of this node.
   *
   * This is properly set when the instance is:
   * - Built internally by Neogma (e.g., from `findOne`, `findMany`, `update`)
   * - Built using `buildFromRecord()`
   *
   * When using `build()` directly, this will be an empty array unless manually set.
   */
  labels: string[];
  /**
   * Returns a new object containing only the schema properties (node data).
   * Does not include relationship configuration data.
   *
   * Unlike `dataValues`, this returns a shallow copy, so mutations won't affect the instance.
   *
   * @returns A new object with the instance's schema property values.
   *
   * @example
   * ```ts
   * const data = user.getDataValues();
   * data.name = 'changed'; // Safe - doesn't affect the instance
   * ```
   */
  getDataValues: () => Properties;
  save: (configuration?: CreateDataParamsI) => Promise<Instance>;
  validate: () => Promise<void>;
  updateRelationship: <
    Alias extends keyof RelatedNodesToAssociateI,
    Return extends boolean = false,
  >(
    data: UpdateRelationshipData<RelatedNodesToAssociateI, Alias>,
    params: {
      alias: Alias;
      where?: InstanceUpdateRelationshipWhereClause<
        RelatedNodesToAssociateI,
        Alias
      >;
      /**
       * When true, the first element of the returned tuple contains the updated relationships.
       * When false (default), the first element is an empty array.
       */
      return?: Return;
      /** When true, throws NeogmaNotFoundError if no relationships were updated. */
      throwIfNoneUpdated?: boolean;
      session?: GenericConfiguration['session'];
    },
  ) => Promise<
    Return extends true
      ? [
          Array<{
            source: Instance;
            target: RelatedNodesToAssociateI[Alias]['Instance'];
            relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
          }>,
          QueryResult,
        ]
      : [[], QueryResult]
  >;
  delete: (
    configuration?: GenericConfiguration & {
      detach?: boolean;
    },
  ) => Promise<number>;
  relateTo: <
    Alias extends keyof RelatedNodesToAssociateI,
    Return extends boolean = false,
  >(params: {
    alias: Alias;
    where: WhereParamsI<
      ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
    >;
    properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
    /** throws an error if the number of created relationships don't equal to this number */
    assertCreatedRelationships?: number;
    /**
     * When true, the first element of the returned tuple contains the created relationships.
     * When false (default), the first element is an empty array.
     */
    return?: Return;
    /** When true, throws NeogmaNotFoundError if no relationships were created. */
    throwIfNoneCreated?: boolean;
    session?: GenericConfiguration['session'];
  }) => Promise<
    Return extends true
      ? [
          Array<{
            source: Instance;
            target: RelatedNodesToAssociateI[Alias]['Instance'];
            relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
          }>,
          number,
        ]
      : [[], number]
  >;
  findRelationships: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where?: InstanceFindRelationshipsWhereClause<
      RelatedNodesToAssociateI,
      Alias
    >;
    /** a limit to apply to the fetched relationships */
    limit?: number;
    /** skip the first n relationships */
    skip?: number;
    /** variable length relationship: minimum hops */
    minHops?: number;
    /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
    maxHops?: number;
    /** When true, throws NeogmaNotFoundError if no relationships are found. */
    throwIfNoneFound?: boolean;
    session?: GenericConfiguration['session'];
    order?: Array<
      | {
          on: 'source';
          property: Extract<keyof Properties, string>;
          direction: 'ASC' | 'DESC';
        }
      | {
          on: 'target';
          property: Extract<
            keyof RelatedNodesToAssociateI[Alias]['Instance'],
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
  }) => Promise<
    Array<{
      source: Instance;
      target: RelatedNodesToAssociateI[Alias]['Instance'];
      relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
    }>
  >;
}

// ============ Instance and Model Types ============

/** the type of instance of the Model */
export type NeogmaInstance<
  /** the properties used in the Model */
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  /** the Methods used in the Model */
  MethodsI extends AnyObject = object,
> = Properties &
  NeogmaInstanceMethodsI<Properties, RelatedNodesToAssociateI, MethodsI> &
  MethodsI;

/**
 * Removes index signatures from a type, keeping only explicitly defined properties.
 * This ensures strict property access checking even when the type extends Record<string, ...>.
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : symbol extends K
        ? never
        : K]: T[K];
};

/**
 * A strict version of NeogmaInstance that removes index signatures from Properties.
 * Used for ThisType in methods to ensure proper type checking of property access.
 */
export type StrictNeogmaInstance<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> = RemoveIndexSignature<Properties> &
  NeogmaInstanceMethodsI<Properties, RelatedNodesToAssociateI, MethodsI> &
  MethodsI;

/** the type of a Neogma Model */
export type NeogmaModel<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject = object,
  StaticsI extends AnyObject = object,
> = NeogmaModelStaticsI<Properties, RelatedNodesToAssociateI, MethodsI> &
  StaticsI;

// Re-export types from relationship.types that are used publicly
export type {
  RelatedNodesCreationParamI,
  RelationshipPropertiesI,
  RelationshipTypePropertyForCreateI,
} from './relationship.types';
