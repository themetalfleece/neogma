import { QueryResult } from 'neo4j-driver';
import revalidator from 'revalidator';
import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import { NeogmaError } from '../Errors/NeogmaError';
import { NeogmaInstanceValidationError } from '../Errors/NeogmaInstanceValidationError';
import { NeogmaNotFoundError } from '../Errors/NeogmaNotFoundError';
import { Neogma } from '../Neogma';
import {
  CreateRelationshipParamsI,
  Neo4jSupportedTypes,
  QueryRunner,
  Runnable,
} from '../Queries/QueryRunner';
import { BindParam } from '../Queries/BindParam/BindParam';
import clone from 'clone';
import {
  WhereParamsI,
  Where,
  WhereParamsByIdentifierI,
} from '../Queries/Where';
import {
  Neo4jSupportedProperties,
  QueryBuilder,
  QueryBuilderParameters,
  UpdateTypes,
} from '../Queries';

type AnyObject = Record<string, any>;

/** the type of the properties to be added to a relationship */
export type RelationshipPropertiesI = Record<
  string,
  Neo4jSupportedTypes | undefined
>;

interface GenericConfiguration {
  session?: Runnable | null;
}

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
    | Object = Object,
  RelationshipProperties extends RelationshipPropertiesI | Object = Object,
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

/** to be used in create functions where the related nodes can be passed for creation */
export type RelatedNodesCreationParamI<
  RelatedNodesToAssociateI extends AnyObject,
> = {
  [key in keyof Partial<RelatedNodesToAssociateI>]: RelationshipTypePropertyForCreateI<
    RelatedNodesToAssociateI[key]['CreateData'],
    RelatedNodesToAssociateI[key]['CreateRelationshipProperties']
  >;
};

/** the type to be used in RelationshipTypePropertyForCreateI.where */
type RelationshipTypePropertyForCreateWhereI<
  RelationshipProperties extends RelationshipPropertiesI,
> = {
  /** where for the target nodes */
  params: WhereParamsI;
  /** whether to merge instead of create the relationship */
  merge?: boolean;
  relationshipProperties?: Partial<RelationshipProperties>;
};
/** the type of the relationship along with the properties, so the proper relationship and/or nodes can be created */
type RelationshipTypePropertyForCreateI<
  Properties,
  RelationshipProperties extends RelationshipPropertiesI,
> = {
  /** create new nodes and create a relationship with them */
  properties?: Array<Properties & Partial<RelationshipProperties>>;
  /** configuration for merging instead of creating the properties/relationships */
  propertiesMergeConfig?: {
    /** merge the created nodes instead of creating them */
    nodes?: boolean;
    /** merge the relationship with the created properties instead of creating it */
    relationship?: boolean;
  };
  /** create a relationship with nodes which are matched by the where */
  where?:
    | RelationshipTypePropertyForCreateWhereI<RelationshipProperties>
    | Array<RelationshipTypePropertyForCreateWhereI<RelationshipProperties>>;
};

type IValidationSchema<T = AnyObject> = Revalidator.ISchema<T> & {
  required: boolean;
};

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

/** parameters when creating nodes */
type CreateDataParamsI = GenericConfiguration & {
  /** whether to merge instead of creating */
  merge?: boolean;
  /** validate all parent and children instances. default to true */
  validate?: boolean;
  /** the relationships which were created by a "where" param must equal to this number */
  assertRelationshipsOfWhere?: number;
};

/** type used for creating nodes. It includes their Properties and Related Nodes */
type CreateDataI<
  Properties,
  RelatedNodesToAssociateI extends AnyObject,
> = Properties & Partial<RelatedNodesCreationParamI<RelatedNodesToAssociateI>>;

type UpdateDataI<Properties> = {
  [K in keyof Properties]?: undefined extends Properties[K]
    ? Properties[K] | UpdateTypes['Remove'] // Allow property removal only if property is optional
    : Properties[K];
};

/** the statics of a Neogma Model */
interface NeogmaModelStaticsI<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject = Object,
  MethodsI extends AnyObject = Object,
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
    relationshipModel: NeogmaModel<any, any, Object, Object> | 'self',
  ) => string;
  getRelationshipModel: (
    relationshipModel: NeogmaModel<any, any, Object, Object> | 'self',
  ) => NeogmaModel<any, any, Object, Object>;
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
    /** variable length relationship: minimum hops */
    minHops?: number;
    /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
    maxHops?: number;
    session?: GenericConfiguration['session'];
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

/** the methods of a Neogma Instance */
interface NeogmaInstanceMethodsI<
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
    session?: GenericConfiguration['session'];
  }) => Promise<
    Array<{
      source: Instance;
      target: RelatedNodesToAssociateI[Alias]['Instance'];
      relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
    }>
  >;
}

/** the type of instance of the Model */
export type NeogmaInstance<
  /** the properties used in the Model */
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  /** the Methods used in the Model */
  MethodsI extends AnyObject = Object,
> = Properties &
  NeogmaInstanceMethodsI<Properties, RelatedNodesToAssociateI, MethodsI> &
  MethodsI;

/** the type of a Neogma Model */
export type NeogmaModel<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject = Object,
  StaticsI extends AnyObject = Object,
> = NeogmaModelStaticsI<Properties, RelatedNodesToAssociateI, MethodsI> &
  StaticsI;

export type FindManyIncludeI<AliasKeys> = {
  alias: AliasKeys;
  /** where params for the nodes of the included Model */
  where?: WhereParamsI;
  /** default false */
  optional?: boolean;
  include?: FindManyIncludeI<any>;
};

/**
 * a function which returns a class with the model operation functions for the given Properties
 * RelatedNodesToAssociateI are the corresponding Nodes for Relationships
 */
export const ModelFactory = <
  /** the base Properties of the node */
  Properties extends Neo4jSupportedProperties,
  /** related nodes to associate. Label-ModelRelatedNodesI pairs */
  RelatedNodesToAssociateI extends AnyObject = Object,
  /** interface for the statics of the model */
  StaticsI extends AnyObject = Object,
  /** interface for the methods of the instance */
  MethodsI extends AnyObject = Object,
>(
  parameters: {
    /** the schema for the validation */
    schema: {
      [index in keyof Properties]:
        | IValidationSchema<Properties>
        | Revalidator.JSONSchema<Properties>;
    };
    /** the label of the nodes */
    label: string | string[];
    /** statics of the Model */
    statics?: Partial<StaticsI>;
    /** method of the Instance */
    methods?: Partial<MethodsI>;
    /** the id key of this model. Is required in order to perform specific instance methods */
    primaryKeyField?: Extract<keyof Properties, string>;
    /** relationships with other models or itself. Alternatively, relationships can be added using Model.addRelationships */
    relationships?: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
  },
  neogma: Neogma,
): NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, StaticsI> => {
  const {
    label: modelLabel,
    primaryKeyField: modelPrimaryKeyField,
    schema,
  } = parameters;
  const statics = parameters.statics || {};
  const methods = parameters.methods || {};
  /* helper name for queries */
  const modelName = (
    modelLabel instanceof Array ? modelLabel : [modelLabel]
  ).join('');
  const schemaKeys = new Set(Object.keys(schema));

  const queryRunner = neogma.queryRunner;

  type CreateData = CreateDataI<Properties, RelatedNodesToAssociateI>;

  type InstanceMethodsI = NeogmaInstanceMethodsI<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;
  type ModelStaticsI = NeogmaModelStaticsI<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;
  type Instance = NeogmaInstance<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;

  /** used for casting the Model, in order to run hooks (as they aren't defined here) */
  type PartialHooksI = Partial<
    Pick<ModelStaticsI, 'beforeCreate' | 'beforeDelete'>
  >;

  const _relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>> =
    clone(parameters.relationships) || {};

  const Model = class ModelClass implements InstanceMethodsI {
    /** whether this instance already exists in the database or it new */
    public __existsInDatabase: InstanceMethodsI['__existsInDatabase'];

    /** the data of Properties */
    public dataValues: InstanceMethodsI['dataValues'];
    /** the changed properties of this instance, to be taken into account when saving it */
    public changed: InstanceMethodsI['changed'];

    public static relationships = _relationships;
    public labels: string[] = [];

    /** adds more relationship configurations to the Model (instead of using the "relationships" param on the ModelFactory constructor) */
    public static addRelationships(
      relationships: Parameters<ModelStaticsI['addRelationships']>[0],
    ): ReturnType<ModelStaticsI['addRelationships']> {
      for (const key in relationships) {
        Model.relationships[key] = relationships[key];
      }
    }

    /**
     * @returns {String} - the normalized label of this Model
     */
    public static getLabel(
      operation?: Parameters<ModelStaticsI['getLabel']>[0],
    ): ReturnType<ModelStaticsI['getLabel']> {
      return QueryBuilder.getNormalizedLabels(modelLabel, operation);
    }

    /**
     * @returns {String} - a new array of the labels of this Model, as given in its definition
     */
    public static getRawLabels(): ReturnType<ModelStaticsI['getRawLabels']> {
      return Array.isArray(modelLabel) ? [...modelLabel] : [modelLabel];
    }

    /**
     *
     * @returns {String} - the primary key field of this Model
     */
    public static getPrimaryKeyField(): ReturnType<
      ModelStaticsI['getPrimaryKeyField']
    > {
      return modelPrimaryKeyField || null;
    }

    public static getModelName(): ReturnType<ModelStaticsI['getModelName']> {
      return modelName;
    }

    public getDataValues(
      this: Instance,
    ): ReturnType<InstanceMethodsI['getDataValues']> {
      const properties: Properties = Object.keys(schema).reduce(
        (acc, key: keyof Properties) => {
          if (this[key] !== undefined) {
            acc[key] = this[key];
          }
          return acc;
        },
        {} as Properties,
      );

      return properties;
    }

    /**
     * validates the given instance
     * @throws NeogmaInstanceValidationError
     */
    public async validate(
      this: Instance,
    ): ReturnType<InstanceMethodsI['validate']> {
      const validationResult = revalidator.validate(this.getDataValues(), {
        type: 'object',
        properties: schema,
      });

      if (validationResult.errors.length) {
        throw new NeogmaInstanceValidationError(
          'Error while validating an instance',
          {
            model: Model,
            errors: validationResult.errors,
          },
        );
      }
    }

    public static build(
      data: Parameters<ModelStaticsI['build']>[0],
      params: Parameters<ModelStaticsI['build']>[1],
    ): ReturnType<ModelStaticsI['build']> {
      const instance = new Model() as unknown as Instance &
        Partial<RelatedNodesToAssociateI>;

      const status = params?.status || 'new';

      instance.__existsInDatabase = status === 'existing';

      instance.dataValues = {} as Properties;
      instance.changed = {} as Record<keyof Properties, boolean>;

      for (const _key of [
        ...Object.keys(schema),
        ...Object.keys(Model.relationships),
      ]) {
        const key = _key as keyof typeof schema;

        /* set dataValues using data */
        if (data.hasOwnProperty(key)) {
          instance.dataValues[key] = data[key];
          instance.changed[key] = status === 'new';
        }

        /* set the setters and getters of the keys */
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
      return instance;
    }

    public static buildFromRecord(
      record: Parameters<ModelStaticsI['buildFromRecord']>[0],
    ): ReturnType<ModelStaticsI['buildFromRecord']> {
      if (!record.properties || !record.labels) {
        throw new NeogmaConstraintError(
          'record is missing the "properties" or "labels" field',
          { actual: record },
        );
      }
      const instance = Model.build(record.properties as any, {
        status: 'existing',
      });

      instance.labels = record.labels;

      return instance;
    }

    /**
     * saves an instance to the database. If it's new it creates it, and if it already exists it edits it
     */
    public async save(
      _configuration?: Parameters<InstanceMethodsI['save']>[0],
    ): ReturnType<InstanceMethodsI['save']> {
      const instance = this as unknown as Instance;
      const configuration: Parameters<InstanceMethodsI['save']>[0] = {
        validate: true,
        ..._configuration,
      };

      if (instance.__existsInDatabase) {
        if (configuration.validate) {
          await instance.validate();
        }

        const primaryKeyField = Model.assertPrimaryKeyField(
          modelPrimaryKeyField,
          'updating via save',
        );

        // if it exists in the database, update the node by only the fields which have changed
        const updateData = Object.entries(instance.changed).reduce(
          (val, [key, changed]) => {
            if (changed && schemaKeys.has(key)) {
              val[key] = instance[key];
            }
            return val;
          },
          {},
        );

        const numberOfPropertiesToSet = Object.keys(updateData).length;
        if (numberOfPropertiesToSet) {
          const updateRes = await Model.update(updateData, {
            return: false,
            session: configuration?.session,
            where: {
              [primaryKeyField]: instance[primaryKeyField],
            },
          });

          const propertiesSet =
            updateRes[1].summary.counters.updates().propertiesSet;

          if (propertiesSet !== numberOfPropertiesToSet) {
            throw new NeogmaError(
              'Update via save failed, not all properties were updated',
              {
                instance: this,
                updateRes,
              },
            );
          }
        }

        // set all changed to false
        for (const key in this.changed) {
          if (!this.changed.hasOwnProperty(key)) {
            continue;
          }
          this.changed[key] = false;
        }

        return instance;
      } else {
        // if it's a new one - it doesn't exist in the database yet, need to create it
        // do not validate here, as createOne validates the instance
        return Model.createOne(
          instance.getDataValues() as CreateDataI<
            Properties,
            RelatedNodesToAssociateI
          >,
          configuration,
        );
      }
    }

    /**
     * creates the node, also creating its children nodes and relationships
     * @param {Properties} data - the data to create, potentially including data for related nodes to be created
     * @param {GenericConfiguration} configuration - query configuration
     * @returns {Properties} - the created data
     */
    public static async createOne(
      data: Parameters<ModelStaticsI['createOne']>[0],
      configuration?: Parameters<ModelStaticsI['createOne']>[1],
    ): ReturnType<ModelStaticsI['createOne']> {
      const instances = await Model.createMany([data], configuration);
      return instances[0];
    }

    public static async createMany(
      data: Parameters<ModelStaticsI['createMany']>[0],
      configuration?: Parameters<ModelStaticsI['createMany']>[1],
    ): ReturnType<ModelStaticsI['createMany']> {
      configuration = configuration || {};
      const validate = !(configuration.validate === false);

      // used only for unique names
      const identifiers = new BindParam();

      /** identifiers and the where/relationship configuration for a relationship to be created */
      const toRelateByIdentifier: {
        [identifier: string]: Array<{
          /** the where params to use */
          where: WhereParamsI;
          /** relatinship information */
          relationship: RelationshipsI<any>[0];
          /** relationship properties */
          properties?: AnyObject;
          /** merge the relationship instead of creating it */
          merge?: boolean;
        }>;
      } = {};

      const rootInstances: Instance[] = [];
      const bulkCreateData: Properties[] = [];

      /** parameters for the QueryBuilder */
      const queryBuilderParams: Array<QueryBuilderParameters['ParameterI']> =
        [];
      /** Bind Param which will be used in the QueryBuilder, and in creating parameters for literals */
      const bindParam = new BindParam();

      /** count the number of relationships created by properties, since it's deterministic, so we can calculate the number of relationships created by where for the assertRelationshipsOfWhere param */
      let relationshipsCreatedByProperties = 0;

      const addCreateToStatement = async (
        _model: NeogmaModel<any, any, Object, Object>,
        dataToUse: Array<CreateData | Instance>,
        /** whether to merge instead of creating the properties */
        mergeProperties?: boolean,
        parentNode?: {
          identifier: string;
          relationship: RelationshipsI<any>[0];
          /** whether to merge the relationship instead of creating it */
          mergeRelationship?: boolean;
        },
      ) => {
        // cast to no statics/method for type safety
        const model = _model as NeogmaModel<any, any>;

        for (const createData of dataToUse) {
          /** identifier for the node to create */
          const identifier = identifiers.getUniqueNameAndAdd('node', null);
          const label = model.getLabel();

          // if the data given is already an instance of the model, use them as is. Else, create a new one and set its labels
          const isCreateDataAnInstanceOfModel =
            createData instanceof (model as any);
          const instance = (
            isCreateDataAnInstanceOfModel
              ? createData
              : model.build(createData, {
                  status: 'new',
                })
          ) as Instance & Partial<RelatedNodesToAssociateI>;

          if (!isCreateDataAnInstanceOfModel) {
            instance.labels = Model.getRawLabels();
          }

          await model.beforeCreate?.(instance);

          if (validate) {
            await instance.validate();
          }

          instance.__existsInDatabase = true;
          // set all changed to false as it's going to be saved
          for (const key in instance.changed) {
            if (!instance.changed.hasOwnProperty(key)) {
              continue;
            }
            instance.changed[key] = false;
          }

          // push to instances only if it's the root node
          if (!parentNode) {
            rootInstances.push(instance);
          }

          const relatedNodesToAssociate: {
            [key in keyof RelatedNodesToAssociateI]?: RelationshipTypePropertyForCreateI<
              any,
              any
            >;
          } = {};
          for (const alias of Object.keys(model.relationships)) {
            if (instance[alias]) {
              relatedNodesToAssociate[
                alias as keyof typeof relatedNodesToAssociate
              ] = instance[alias];
            }
          }

          if (relatedNodesToAssociate || parentNode || mergeProperties) {
            /* if it has related nodes to associated or it has a parent node or it's to be merged, create it as a single node, with an identifier */

            const createOrMergeProperties:
              | QueryBuilderParameters['CreateI']
              | QueryBuilderParameters['MergeI'] = {
              identifier,
              label,
              properties: instance.getDataValues(),
            };
            if (mergeProperties) {
              queryBuilderParams.push({
                merge: createOrMergeProperties,
              });
            } else {
              queryBuilderParams.push({
                create: createOrMergeProperties,
              });
            }

            /** if it has a parent node, also create a relationship with it */
            if (parentNode) {
              const { relationship, identifier: parentIdentifier } = parentNode;

              const relatedQueryBuilderParameters:
                | QueryBuilderParameters['CreateI']
                | QueryBuilderParameters['MergeI'] = {
                related: [
                  {
                    identifier: parentIdentifier,
                  },
                  {
                    direction: relationship.direction,
                    name: relationship.name,
                    properties:
                      model.getRelationshipProperties(
                        relationship,
                        createData,
                      ) || null,
                  },
                  {
                    identifier,
                  },
                ],
              };

              if (mergeProperties) {
                queryBuilderParams.push({
                  merge: relatedQueryBuilderParameters,
                });
              } else {
                queryBuilderParams.push({
                  create: relatedQueryBuilderParameters,
                });
              }
            }

            /** create the related nodes */
            for (const relationshipAlias in relatedNodesToAssociate) {
              const relatedNodesData =
                relatedNodesToAssociate[relationshipAlias];
              if (!relatedNodesData) {
                continue;
              }

              const relationship =
                model.getRelationshipConfiguration(relationshipAlias);
              const otherModel = model.getRelationshipModel(relationship.model);

              if (relatedNodesData.properties) {
                await addCreateToStatement(
                  otherModel,
                  relatedNodesData.properties,
                  relatedNodesData.propertiesMergeConfig?.nodes,
                  {
                    identifier,
                    relationship,
                    mergeRelationship:
                      relatedNodesData.propertiesMergeConfig?.relationship,
                  },
                );

                // increment the relationships-created-by-properties by the length of the data array
                relationshipsCreatedByProperties +=
                  relatedNodesData.properties.length;
              }
              if (relatedNodesData.where) {
                const whereArr =
                  relatedNodesData.where instanceof Array
                    ? relatedNodesData.where
                    : [relatedNodesData.where];

                for (const whereEntry of whereArr) {
                  if (!toRelateByIdentifier[identifier]) {
                    toRelateByIdentifier[identifier] = [];
                  }

                  const relationshipProperties =
                    model.getRelationshipProperties(
                      relationship,
                      whereEntry.relationshipProperties || {},
                    );

                  toRelateByIdentifier[identifier].push({
                    relationship,
                    where: whereEntry.params,
                    properties: relationshipProperties,
                    merge: whereEntry.merge,
                  });
                }
              }
            }
          } else {
            /* if it doesn't have related nodes to associated and it doesn't have a parent node add it to the array so they'll be bulk created */
            bulkCreateData.push(instance.getDataValues());
          }
        }
      };

      await addCreateToStatement(
        Model as unknown as NeogmaModel<any, any>,
        data,
        configuration?.merge,
        undefined,
      );

      // parse data to bulk create
      if (bulkCreateData.length) {
        const bulkCreateIdentifier = identifiers.getUniqueNameAndAdd(
          'bulkCreateNodes',
          null,
        );
        const bulkCreateOptionsParam = bindParam.getUniqueNameAndAdd(
          'bulkCreateOptions',
          bulkCreateData,
        );
        const bulkCreateDataIdentifier = identifiers.getUniqueNameAndAdd(
          'bulkCreateData',
          null,
        );

        /** bulk create via unwind at the beginning of the query */
        queryBuilderParams.unshift(
          {
            unwind: {
              value: `$${bulkCreateOptionsParam}`,
              as: bulkCreateDataIdentifier,
            },
          },
          {
            create: {
              identifier: bulkCreateIdentifier,
              label: this.getLabel(),
            },
          },
          {
            set: `${bulkCreateIdentifier} += ${bulkCreateDataIdentifier}`,
          },
        );
      }

      // parse toRelateByIdentifier
      for (const identifier of Object.keys(toRelateByIdentifier)) {
        /** to be used in the WITH clause */
        const allNeededIdentifiers = Object.keys(toRelateByIdentifier);
        for (const relateParameters of toRelateByIdentifier[identifier]) {
          const relationship = relateParameters.relationship;
          const relationshipIdentifier = identifiers.getUniqueNameAndAdd(
            'r',
            null,
          );
          const targetNodeModel = Model.getRelationshipModel(
            relationship.model,
          );
          const targetNodeLabel = targetNodeModel.getLabel();
          const targetNodeIdentifier = identifiers.getUniqueNameAndAdd(
            'targetNode',
            null,
          );

          const relatedQueryBuilderParameters:
            | QueryBuilderParameters['CreateI']
            | QueryBuilderParameters['MergeI'] = {
            related: [
              {
                identifier,
              },
              {
                direction: relationship.direction,
                name: relationship.name,
                identifier: relationshipIdentifier,
              },
              {
                identifier: targetNodeIdentifier,
              },
            ],
          };

          queryBuilderParams.push(
            {
              with: `DISTINCT ${allNeededIdentifiers.join(', ')}`,
            },
            {
              match: {
                identifier: targetNodeIdentifier,
                label: targetNodeLabel,
              },
            },
            {
              where: {
                [targetNodeIdentifier]: relateParameters.where,
              },
            },
            relateParameters.merge
              ? {
                  merge: relatedQueryBuilderParameters,
                }
              : {
                  create: relatedQueryBuilderParameters,
                },
          );

          if (
            relateParameters.properties &&
            Object.keys(relateParameters.properties).length > 0
          ) {
            /* create the relationship properties */
            const relationshipPropertiesParam = bindParam.getUniqueNameAndAdd(
              'relationshipProperty',
              relateParameters.properties,
            );

            queryBuilderParams.push({
              set: `${relationshipIdentifier} += $${relationshipPropertiesParam}`,
            });
          }

          // remove this relateParameters from the array
          toRelateByIdentifier[identifier] = toRelateByIdentifier[
            identifier
          ].filter((r) => r !== relateParameters);
        }
        // remove the identifier from the object
        delete toRelateByIdentifier[identifier];
      }

      // create a QueryBuilder instance, add the params and run it
      const res = await new QueryBuilder(bindParam)
        .addParams(queryBuilderParams)
        .run(queryRunner, configuration?.session);

      const { assertRelationshipsOfWhere } = configuration;
      if (assertRelationshipsOfWhere) {
        const relationshipsCreated =
          res.summary.counters.updates().relationshipsCreated;
        // the total created relationship must equal the ones created by properties (calculated) plus the ones created by where (param)
        if (
          relationshipsCreated !==
          relationshipsCreatedByProperties + assertRelationshipsOfWhere
        ) {
          throw new NeogmaError(
            `Not all required relationships by where param were created`,
            {
              relationshipsCreated,
              relationshipCreatedByProperties: relationshipsCreatedByProperties,
              assertRelationshipsOfWhere,
            },
          );
        }
      }

      return rootInstances;
    }

    public static getRelationshipConfiguration = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): Required<RelationshipsI<RelatedNodesToAssociateI>[Alias]> => {
      if (!Model.relationships) {
        throw new NeogmaNotFoundError(
          `Relationship definitions can't be found for the model ${modelName}`,
        );
      }

      const relationship = Model.relationships[alias as string];

      if (!relationship) {
        throw new NeogmaNotFoundError(
          `The relationship of the alias ${
            alias as string
          } can't be found for the model ${modelName}`,
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
    };

    /**
     * reverses the configuration of a relationship, so it can be easily duplicated when defining another Model.
     */
    public static reverseRelationshipConfiguration = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): RelationshipsI<RelatedNodesToAssociateI>[Alias] => {
      const relationship = Model.getRelationshipConfiguration(alias);

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
        model: Model,
        direction: reverseDirection(relationship.direction),
        name: relationship.name,
        properties: relationship.properties,
      };
    };

    public static async update(
      data: Parameters<ModelStaticsI['update']>[0],
      params?: Parameters<ModelStaticsI['update']>[1],
    ): ReturnType<ModelStaticsI['update']> {
      const label = Model.getLabel();
      const identifier = 'node';

      const where = params?.where
        ? {
            [identifier]: params.where,
          }
        : undefined;

      const res = await queryRunner.update({
        label,
        data,
        where,
        identifier,
        return: params?.return,
        session: params?.session,
      });

      const instances = res.records.map((record) =>
        Model.buildFromRecord(record.get(identifier)),
      );

      return [instances, res] as [Instance[], QueryResult];
    }

    public static async updateRelationship(
      data: Parameters<ModelStaticsI['updateRelationship']>[0],
      params: Parameters<ModelStaticsI['updateRelationship']>[1],
    ): ReturnType<ModelStaticsI['updateRelationship']> {
      const relationship = Model.getRelationshipConfiguration(params.alias);

      const identifiers = {
        source: 'source',
        target: 'target',
        relationship: 'r',
      };
      const labels = {
        source: Model.getLabel(),
        target: Model.getRelationshipModel(relationship.model).getLabel(),
      };

      const where: Where = new Where({});
      if (params.where?.source) {
        where.addParams({ [identifiers.source]: params.where.source });
      }
      if (params.where?.target) {
        where.addParams({ [identifiers.target]: params.where.target });
      }
      if (params.where?.relationship) {
        where.addParams({
          [identifiers.relationship]: params.where.relationship,
        });
      }

      const queryBuilder = new QueryBuilder(
        /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
        where.getBindParam().clone(),
      );

      queryBuilder.match({
        related: [
          {
            identifier: identifiers.source,
            label: labels.source,
          },
          {
            direction: relationship.direction,
            name: relationship.name,
            identifier: identifiers.relationship,
          },
          {
            identifier: identifiers.target,
            label: labels.target,
          },
        ],
      });

      if (where) {
        queryBuilder.where(where);
      }

      queryBuilder.set({
        properties: data,
        identifier: identifiers.relationship,
      });

      return queryBuilder.run(queryRunner, params.session);
    }

    public async updateRelationship(
      data: Parameters<InstanceMethodsI['updateRelationship']>[0],
      params: Parameters<InstanceMethodsI['updateRelationship']>[1],
    ): ReturnType<InstanceMethodsI['updateRelationship']> {
      const primaryKeyField = Model.assertPrimaryKeyField(
        modelPrimaryKeyField,
        'updateRelationship',
      );
      return Model.updateRelationship(data, {
        ...params,
        where: {
          ...params.where,
          source: {
            [primaryKeyField]: this[primaryKeyField],
          },
        },
      });
    }

    public static async delete(
      configuration?: Parameters<ModelStaticsI['delete']>[0],
    ): ReturnType<ModelStaticsI['delete']> {
      const detach = configuration?.detach;
      const whereParams = configuration?.where;

      const label = Model.getLabel();

      const identifier = 'node';
      const res = await queryRunner.delete({
        label,
        where: whereParams && {
          [identifier]: whereParams,
        },
        detach,
        identifier,
        session: configuration?.session,
      });
      return QueryRunner.getNodesDeleted(res);
    }

    public async delete(
      this: Instance,
      configuration?: Parameters<InstanceMethodsI['delete']>[0],
    ): ReturnType<InstanceMethodsI['delete']> {
      const primaryKeyField = Model.assertPrimaryKeyField(
        modelPrimaryKeyField,
        'delete',
      );

      await (Model as unknown as PartialHooksI).beforeDelete?.(this);

      return Model.delete({
        ...configuration,
        where: {
          [primaryKeyField]: this[primaryKeyField],
        },
      });
    }

    public static async findMany(
      params?: Parameters<ModelStaticsI['findMany']>[0],
    ): ReturnType<ModelStaticsI['findMany']> {
      const label = this.getLabel();

      const rootIdentifier = modelName;

      const bindParam = new BindParam();
      const rootWhere =
        params?.where &&
        new Where(
          {
            [rootIdentifier]: params?.where,
          },
          bindParam,
        );

      const queryBuilder = new QueryBuilder(bindParam);

      queryBuilder.match({
        identifier: rootIdentifier,
        label,
      });

      if (rootWhere) {
        queryBuilder.where(rootWhere);
      }

      queryBuilder.return(rootIdentifier);

      if (params?.order) {
        queryBuilder.orderBy(
          params.order
            .filter(([field]) => schemaKeys.has(field))
            .map(([property, direction]) => ({
              identifier: rootIdentifier,
              direction,
              property,
            })),
        );
      }

      if (params?.skip) {
        queryBuilder.skip(+params.skip);
      }

      if (params?.limit) {
        queryBuilder.limit(+params.limit);
      }

      const res = await queryBuilder.run(queryRunner, params?.session);

      let returnData: Instance[] | Properties[] = [];

      if (params?.plain) {
        returnData = res.records.map(
          (record) => record.get(rootIdentifier).properties,
        );
      } else {
        returnData = res.records.map((record) => {
          const instance = Model.buildFromRecord(record.get(rootIdentifier));
          instance.__existsInDatabase = true;
          return instance;
        });
      }

      if (params?.throwIfNoneFound && !returnData.length) {
        throw new NeogmaNotFoundError(`No node was found`, {
          label: Model.getLabel(),
        });
      }

      return returnData;
    }

    public static async findOne(
      params?: Parameters<ModelStaticsI['findOne']>[0],
    ): ReturnType<ModelStaticsI['findOne']> {
      const instances = await Model.findMany({
        ...params,
        limit: 1,
      });

      const instance = instances?.[0];

      if (params?.throwIfNotFound && !instance) {
        throw new NeogmaNotFoundError('Nodes not found', {
          label: Model.getLabel(),
        });
      }

      return instance || null;
    }

    /** creates a relationship by using the configuration specified in "relationships" from the given alias */
    public static async relateTo(
      params: Parameters<ModelStaticsI['relateTo']>[0],
    ): ReturnType<ModelStaticsI['relateTo']> {
      const relationship = Model.getRelationshipConfiguration(
        params.alias as keyof RelatedNodesToAssociateI,
      );

      const where: WhereParamsByIdentifierI = {};
      if (params.where) {
        where[QueryRunner.identifiers.createRelationship.source] =
          params.where.source;
        where[QueryRunner.identifiers.createRelationship.target] =
          params.where.target;
      }

      const relationshipProperties = Model.getRelationshipProperties(
        relationship,
        params.properties || {},
      );

      const res = await queryRunner.createRelationship({
        source: {
          label: this.getLabel(),
        },
        target: {
          label: Model.getRelationshipModel(relationship.model).getLabel(),
        },
        relationship: {
          name: relationship.name,
          direction: relationship.direction,
          properties: relationshipProperties,
        },
        where,
        session: params.session,
      });
      const relationshipsCreated =
        res.summary.counters.updates().relationshipsCreated;

      const { assertCreatedRelationships } = params;
      if (
        assertCreatedRelationships &&
        relationshipsCreated !== assertCreatedRelationships
      ) {
        throw new NeogmaError(`Not all required relationships were created`, {
          relationshipsCreated,
          ...params,
        });
      }

      return relationshipsCreated;
    }

    /** wrapper for the static relateTo, where the source is always this node */
    public async relateTo(
      params: Parameters<InstanceMethodsI['relateTo']>[0],
    ): ReturnType<InstanceMethodsI['relateTo']> {
      const primaryKeyField = Model.assertPrimaryKeyField(
        modelPrimaryKeyField,
        'relateTo',
      );

      return Model.relateTo({
        ...params,
        where: {
          source: {
            [primaryKeyField]: this[primaryKeyField],
          },
          target: params.where,
        },
      });
    }

    public static async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      params: Parameters<ModelStaticsI['findRelationships']>[0],
    ): Promise<ReturnType<ModelStaticsI['findRelationships']>> {
      const { alias, where, limit, session, minHops, maxHops } = params;

      const identifiers = {
        source: 'source',
        target: 'target',
        relationship: 'relationship',
      };

      const relationship = Model.getRelationshipByAlias(
        alias as keyof RelatedNodesToAssociateI,
      );
      const relationshipModel = Model.getRelationshipModel(relationship.model);

      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            {
              model: Model,
              where: where?.source,
              identifier: identifiers.source,
            },
            {
              ...relationship,
              where: where?.relationship,
              identifier: identifiers.relationship,
              minHops,
              maxHops,
            },
            {
              label: relationshipModel.getLabel(),
              where: where?.target,
              identifier: identifiers.target,
            },
          ],
        })
        .return(Object.values(identifiers));
      if (limit) {
        queryBuilder.limit(limit);
      }

      const res = await queryBuilder.run(queryRunner, session);

      return res.records.map((record) => ({
        source: Model.buildFromRecord(record.get(identifiers.source)),
        target: relationshipModel.buildFromRecord(
          record.get(identifiers.target),
        ),
        relationship: record.get(identifiers.relationship).properties,
      })) as Array<{
        source: Instance;
        target: RelatedNodesToAssociateI[Alias]['Instance'];
        relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
      }>;
    }

    public static async deleteRelationships(
      params: Parameters<ModelStaticsI['deleteRelationships']>[0],
    ): Promise<ReturnType<ModelStaticsI['deleteRelationships']>> {
      const { alias, where, session } = params;

      if (!where) {
        throw new NeogmaError(
          '`where` param was not given to deleteRelationships',
        );
      }

      const identifiers = {
        source: 'source',
        target: 'target',
        relationship: 'relationship',
      };

      const relationship = Model.getRelationshipByAlias(
        alias as keyof RelatedNodesToAssociateI,
      );
      const relationshipModel = Model.getRelationshipModel(relationship.model);

      const queryBuilder = new QueryBuilder()
        .match({
          related: [
            {
              model: Model,
              where: where.source,
              identifier: identifiers.source,
            },
            {
              ...relationship,
              where: where.relationship,
              identifier: identifiers.relationship,
            },
            {
              label: relationshipModel.getLabel(),
              where: where.target,
              identifier: identifiers.target,
            },
          ],
        })
        .delete({
          identifiers: identifiers.relationship,
        });

      const res = await queryBuilder.run(queryRunner, session);

      return QueryRunner.getRelationshipsDeleted(res);
    }

    public async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      params: Parameters<InstanceMethodsI['findRelationships']>[0],
    ): Promise<
      Array<{
        source: Instance;
        target: RelatedNodesToAssociateI[Alias]['Instance'];
        relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
      }>
    > {
      const { where, alias, limit, session } = params;
      const primaryKeyField = Model.assertPrimaryKeyField(
        modelPrimaryKeyField,
        'relateTo',
      );

      const res = await Model.findRelationships<Alias>({
        alias,
        limit,
        session,
        where: {
          relationship: where?.relationship,
          target: where?.target,
          source: {
            [primaryKeyField]: this[primaryKeyField],
          },
        },
      });

      return res as Array<{
        source: Instance;
        target: RelatedNodesToAssociateI[Alias]['Instance'];
        relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
      }>;
    }

    /**
     * @param {queryRunner.CreateRelationshipParamsI} - the parameters including the 2 nodes and the label/direction of the relationship between them
     * @param {GenericConfiguration} configuration - query configuration
     * @returns {Number} - the number of created relationships
     */
    public static async createRelationship(
      params: Parameters<ModelStaticsI['createRelationship']>[0],
    ): ReturnType<ModelStaticsI['createRelationship']> {
      const res = await queryRunner.createRelationship(params);
      const relationshipsCreated =
        res.summary.counters.updates().relationshipsCreated;

      const { assertCreatedRelationships } = params;
      if (
        assertCreatedRelationships &&
        relationshipsCreated !== assertCreatedRelationships
      ) {
        throw new NeogmaError(`Not all required relationships were created`, {
          relationshipsCreated,
          ...params,
        });
      }

      return relationshipsCreated;
    }

    /** gets the label from the given model for a relationship */
    public static getLabelFromRelationshipModel(
      relationshipModel: Parameters<
        ModelStaticsI['getLabelFromRelationshipModel']
      >[0],
    ): ReturnType<ModelStaticsI['getLabelFromRelationshipModel']> {
      return relationshipModel === 'self'
        ? Model.getLabel()
        : relationshipModel.getLabel();
    }

    /** gets the model of a relationship */
    public static getRelationshipModel(
      relationshipModel: Parameters<ModelStaticsI['getRelationshipModel']>[0],
    ): ReturnType<ModelStaticsI['getRelationshipModel']> {
      return relationshipModel === 'self'
        ? (Model as unknown as NeogmaModel<any, any>)
        : relationshipModel;
    }

    public static assertPrimaryKeyField(
      primaryKeyField: Parameters<ModelStaticsI['assertPrimaryKeyField']>[0],
      operation: Parameters<ModelStaticsI['assertPrimaryKeyField']>[1],
    ): ReturnType<ModelStaticsI['assertPrimaryKeyField']> {
      if (!primaryKeyField) {
        throw new NeogmaConstraintError(
          `This operation (${operation}) required the model to have a primaryKeyField`,
        );
      }
      return primaryKeyField;
    }

    public static getRelationshipProperties = (
      relationship: RelationshipsI<any>[0],
      dataToUse: Neo4jSupportedProperties,
    ): Neo4jSupportedProperties => {
      const keysToUse = Object.keys(relationship.properties || {});
      /** properties to be used in the relationship */
      const relationshipProperties = {};
      /** total validation for the properties */
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
    };

    public static getRelationshipByAlias = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): Pick<
      RelatedNodesToAssociateI[Alias],
      'name' | 'direction' | 'model'
    > => {
      const relationshipConfiguration =
        Model.getRelationshipConfiguration(alias);

      return {
        model: relationshipConfiguration.model,
        direction: relationshipConfiguration.direction,
        name: relationshipConfiguration.name,
      };
    };
  };

  for (const staticKey in statics) {
    if (!statics.hasOwnProperty(staticKey)) {
      continue;
    }
    Model[staticKey as keyof typeof Model] = statics[staticKey];
  }

  for (const methodKey in methods) {
    if (!methods.hasOwnProperty(methodKey)) {
      continue;
    }
    Model.prototype[methodKey as keyof typeof Model.prototype] =
      methods[methodKey];
  }

  // add to modelsByName
  neogma.modelsByName[modelName] = Model;

  return Model as unknown as NeogmaModel<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    StaticsI
  >;
};
