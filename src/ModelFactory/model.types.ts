import type { QueryResult } from 'neo4j-driver';

import type { QueryBuilder } from '../QueryBuilder';
import type { Neo4jSupportedProperties } from '../QueryRunner';
import type { CreateRelationshipParamsI } from '../QueryRunner';
import type { WhereParamsI } from '../Where';
import type {
  RelatedNodesCreationParamI,
  RelationshipPropertiesI,
} from './relationship.types';
import type {
  AnyObject,
  GenericConfiguration,
  IValidationSchema,
} from './shared.types';

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
  CreateRelationshipProperties extends
    | RelationshipPropertiesI
    | object = object,
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
  update: (
    data: UpdateData,
    params?: GenericConfiguration & {
      where?: WhereParamsI;
      /** defaults to false. Whether to return the properties of the nodes after the update. If it's false, the first entry of the return value of this function will be an empty array */
      return?: boolean;
    },
  ) => Promise<[Instance[], QueryResult]>;
  updateRelationship: (
    data: AnyObject,
    params: {
      alias: keyof RelatedNodesToAssociateI;
      where?: {
        source?: WhereParamsI;
        target?: WhereParamsI;
        relationship?: WhereParamsI;
      };
      session?: GenericConfiguration['session'];
    },
  ) => Promise<QueryResult>;
  /** returns the relationship properties to be created, from the data in dataToUse (with the alias as a key) */
  getRelationshipProperties: (
    relationship: RelationshipsI<any>[0],
    dataToUse: Neo4jSupportedProperties,
  ) => Neo4jSupportedProperties;
  delete: (
    configuration?: GenericConfiguration & {
      detach?: boolean;
      where: WhereParamsI;
    },
  ) => Promise<number>;
  findMany: <Plain extends boolean = false>(
    params?: GenericConfiguration & {
      /** where params for the nodes of this Model */
      where?: WhereParamsI;
      limit?: number;
      skip?: number;
      order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
      /** returns an array of the plain properties, instead of Instances */
      plain?: Plain;
      /** throws an error if no nodes are found (results length 0) */
      throwIfNoneFound?: boolean;
    },
  ) => Promise<Plain extends true ? Properties[] : Instance[]>;
  findOne: <Plain extends boolean = false>(
    params?: GenericConfiguration & {
      /** where params for the nodes of this Model */
      where?: WhereParamsI;
      order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
      /** returns the plain properties, instead of Instance */
      plain?: Plain;
      /** throws an error if the node is not found */
      throwIfNotFound?: boolean;
    },
  ) => Promise<(Plain extends true ? Properties : Instance) | null>;
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
  relateTo: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where: {
      source: WhereParamsI;
      target: WhereParamsI;
    };
    properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
    /** throws an error if the number of created relationships don't equal to this number */
    assertCreatedRelationships?: number;
    session?: GenericConfiguration['session'];
  }) => Promise<number>;
  findRelationships: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where?: {
      source?: WhereParamsI;
      target?: WhereParamsI;
      relationship?: WhereParamsI;
    };
    /** a limit to apply to the fetched relationships */
    limit?: number;
    /** skip the first n relationships */
    skip?: number;
    /** variable length relationship: minimum hops */
    minHops?: number;
    /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
    maxHops?: number;
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
    where: {
      source?: WhereParamsI;
      target?: WhereParamsI;
      relationship?: WhereParamsI;
    };
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
  __existsInDatabase: boolean;
  dataValues: Properties;
  changed: Record<keyof Properties, boolean>;
  labels: string[];
  getDataValues: () => Properties;
  save: (configuration?: CreateDataParamsI) => Promise<Instance>;
  validate: () => Promise<void>;
  updateRelationship: (
    data: AnyObject,
    params: {
      alias: keyof RelatedNodesToAssociateI;
      where?: {
        target?: WhereParamsI;
        relationship?: WhereParamsI;
      };
      session?: GenericConfiguration['session'];
    },
  ) => Promise<QueryResult>;
  delete: (
    configuration?: GenericConfiguration & {
      detach?: boolean;
    },
  ) => Promise<number>;
  relateTo: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where: WhereParamsI;
    properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
    /** throws an error if the number of created relationships don't equal to this number */
    assertCreatedRelationships?: number;
    session?: GenericConfiguration['session'];
  }) => Promise<number>;
  findRelationships: <Alias extends keyof RelatedNodesToAssociateI>(params: {
    alias: Alias;
    where?: {
      relationship: WhereParamsI;
      target: WhereParamsI;
    };
    /** a limit to apply to the fetched relationships */
    limit?: number;
    /** skip the first n relationships */
    skip?: number;
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
