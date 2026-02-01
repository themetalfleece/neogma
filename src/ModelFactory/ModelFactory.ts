import clone from 'clone';

import type { Neogma } from '../Neogma';
import { QueryBuilder } from '../QueryBuilder';
import type { Neo4jSupportedProperties } from '../QueryRunner';
// Import operations from new directories
import type { BuildContext } from './build';
import {
  build as buildFn,
  buildFromRecord as buildFromRecordFn,
} from './build';
import type { CreateContext } from './createMany';
import { createMany as createManyFn } from './createMany';
import { createOne as createOneFn } from './createOne';
import { createRelationship as createRelationshipFn } from './createRelationship';
import type { DeleteContext, InstanceDeleteContext } from './delete';
import { deleteNodes } from './delete';
import { deleteInstance } from './delete';
import type { DeleteRelationshipsWhereClause } from './deleteRelationships';
import { deleteRelationships as deleteRelationshipsFn } from './deleteRelationships';
import type { FindContext } from './findMany';
import { findMany as findManyFn } from './findMany';
import { findOne as findOneFn } from './findOne';
import type {
  FindRelationshipsWhereClause,
  InstanceFindRelationshipsParams,
} from './findRelationships';
import {
  findRelationships as findRelationshipsFn,
  instanceFindRelationships,
} from './findRelationships';
import { getDataValues as getDataValuesFn } from './getDataValues';
import type {
  NeogmaInstance,
  NeogmaInstanceMethodsI,
  NeogmaModel,
  NeogmaModelStaticsI,
  RelationshipsI,
  StrictNeogmaInstance,
} from './model.types';
import type {
  InstanceRelateToParams,
  InstanceRelationshipContext,
  RelateToWhereClause,
  RelationshipCrudContext,
} from './relateTo';
import { relateTo as relateToFn } from './relateTo';
import { instanceRelateTo } from './relateTo';
import type { RelateToResult } from './relateTo/relateTo.static';
import type { RelationshipConfigContext } from './relationshipConfig';
import {
  addRelationships as addRelationshipsFn,
  getRelationshipByAlias as getRelationshipByAliasFn,
  getRelationshipConfiguration as getRelationshipConfigurationFn,
  getRelationshipProperties as getRelationshipPropertiesFn,
  reverseRelationshipConfiguration as reverseRelationshipConfigurationFn,
} from './relationshipConfig';
import type { SaveContext } from './save';
import { save as saveFn } from './save';
import type {
  AnyObject,
  GenericConfiguration,
  IValidationSchema,
} from './shared.types';
import type { UpdateContext, UpdateParams, UpdateResult } from './update';
import { update as updateFn } from './update';
import type {
  InstanceUpdateRelationshipParams,
  UpdateRelationshipData,
  UpdateRelationshipWhereClause,
} from './updateRelationship';
import {
  instanceUpdateRelationship,
  updateRelationship as updateRelationshipFn,
} from './updateRelationship';
import type { UpdateRelationshipResult } from './updateRelationship/updateRelationship.static';
import {
  assertPrimaryKeyField,
  getLabelFromRelationshipModel,
  getRelationshipModel,
} from './utils';
import type { ValidateContext } from './validate';
import { validate as validateFn } from './validate';

/**
 * Creates a Model class for interacting with Neo4j nodes of a specific type.
 * Models provide CRUD operations, relationship management, validation, and instance methods.
 *
 * @typeParam Properties - The properties of the nodes this model represents
 * @typeParam RelatedNodesToAssociateI - Configuration for related nodes and relationships
 * @typeParam StaticsI - Custom static methods to add to the model
 * @typeParam MethodsI - Custom instance methods to add to model instances
 *
 * @param parameters - The model configuration
 * @param parameters.schema - Validation schema for node properties
 * @param parameters.label - The Neo4j label(s) for nodes of this type
 * @param parameters.statics - Optional custom static methods
 * @param parameters.methods - Optional custom instance methods
 * @param parameters.primaryKeyField - Optional field to use as the primary key
 * @param parameters.relationships - Optional relationship configurations
 * @param neogma - The Neogma instance to use for database operations
 *
 * @returns A Model class with CRUD operations and relationship management
 *
 * @example
 * ```ts
 * const Users = ModelFactory({
 *   label: 'User',
 *   schema: {
 *     id: { type: 'string', required: true },
 *     name: { type: 'string', minLength: 3 },
 *   },
 *   primaryKeyField: 'id',
 *   relationshipCreationKeys: {},
 * }, neogma);
 *
 * const user = await Users.createOne({ id: '1', name: 'John' });
 * ```
 */
export const ModelFactory = <
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject = object,
  StaticsI extends AnyObject = object,
  MethodsI extends AnyObject = object,
>(
  parameters: {
    schema: {
      [index in keyof Properties]:
        | IValidationSchema<Properties>
        | Revalidator.JSONSchema<Properties>;
    };
    label: string | string[];
    statics?: Partial<StaticsI>;
    methods?: Partial<MethodsI> &
      ThisType<
        StrictNeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>
      >;
    primaryKeyField?: Extract<keyof Properties, string>;
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
  const modelName = (
    modelLabel instanceof Array ? modelLabel : [modelLabel]
  ).join('');
  const schemaKeys = new Set(Object.keys(schema));

  const queryRunner = neogma.queryRunner;

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

  const _relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>> =
    clone(parameters.relationships) || {};

  // Define the Model class
  const Model = class ModelClass implements InstanceMethodsI {
    public __existsInDatabase: InstanceMethodsI['__existsInDatabase'];
    public dataValues: InstanceMethodsI['dataValues'];
    public changed: InstanceMethodsI['changed'];
    public labels: string[] = [];

    public static relationships = _relationships;

    // Label configuration methods
    public static getLabel(
      operation?: Parameters<ModelStaticsI['getLabel']>[0],
    ): ReturnType<ModelStaticsI['getLabel']> {
      return QueryBuilder.getNormalizedLabels(modelLabel, operation);
    }

    public static getRawLabels(): ReturnType<ModelStaticsI['getRawLabels']> {
      return Array.isArray(modelLabel) ? [...modelLabel] : [modelLabel];
    }

    public static getPrimaryKeyField(): ReturnType<
      ModelStaticsI['getPrimaryKeyField']
    > {
      return modelPrimaryKeyField || null;
    }

    public static getModelName(): ReturnType<ModelStaticsI['getModelName']> {
      return modelName;
    }

    // Relationship configuration methods
    public static addRelationships(
      relationships: Parameters<ModelStaticsI['addRelationships']>[0],
    ): ReturnType<ModelStaticsI['addRelationships']> {
      const ctx: RelationshipConfigContext<RelatedNodesToAssociateI> = {
        relationships: Model.relationships,
        modelName,
        Model: Model as unknown as NeogmaModel<
          any,
          RelatedNodesToAssociateI,
          any,
          any
        >,
      };
      return addRelationshipsFn(ctx, relationships);
    }

    public static getRelationshipConfiguration = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): Required<RelationshipsI<RelatedNodesToAssociateI>[Alias]> => {
      const ctx: RelationshipConfigContext<RelatedNodesToAssociateI> = {
        relationships: Model.relationships,
        modelName,
        Model: Model as unknown as NeogmaModel<
          any,
          RelatedNodesToAssociateI,
          any,
          any
        >,
      };
      return getRelationshipConfigurationFn(ctx, alias);
    };

    public static reverseRelationshipConfiguration = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): RelationshipsI<RelatedNodesToAssociateI>[Alias] => {
      const ctx: RelationshipConfigContext<RelatedNodesToAssociateI> = {
        relationships: Model.relationships,
        modelName,
        Model: Model as unknown as NeogmaModel<
          any,
          RelatedNodesToAssociateI,
          any,
          any
        >,
      };
      return reverseRelationshipConfigurationFn(ctx, alias);
    };

    public static getRelationshipByAlias = <
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      alias: Alias,
    ): Pick<
      RelatedNodesToAssociateI[Alias],
      'name' | 'direction' | 'model'
    > => {
      const ctx: RelationshipConfigContext<RelatedNodesToAssociateI> = {
        relationships: Model.relationships,
        modelName,
        Model: Model as unknown as NeogmaModel<
          any,
          RelatedNodesToAssociateI,
          any,
          any
        >,
      };
      return getRelationshipByAliasFn(ctx, alias);
    };

    public static getRelationshipProperties = (
      relationship: RelationshipsI<any>[0],
      dataToUse: Neo4jSupportedProperties,
    ): Neo4jSupportedProperties => {
      return getRelationshipPropertiesFn(
        relationship,
        dataToUse,
        Model as unknown as NeogmaModel<any, any, any, any>,
      );
    };

    // Utility methods
    public static getLabelFromRelationshipModel(
      relationshipModel: Parameters<
        ModelStaticsI['getLabelFromRelationshipModel']
      >[0],
    ): ReturnType<ModelStaticsI['getLabelFromRelationshipModel']> {
      return getLabelFromRelationshipModel(
        Model as unknown as NeogmaModel<any, any, any, any>,
        relationshipModel,
      );
    }

    public static getRelationshipModel(
      relationshipModel: Parameters<ModelStaticsI['getRelationshipModel']>[0],
    ): ReturnType<ModelStaticsI['getRelationshipModel']> {
      return getRelationshipModel(
        Model as unknown as NeogmaModel<any, any, any, any>,
        relationshipModel,
      );
    }

    public static assertPrimaryKeyField(
      primaryKeyField: Parameters<ModelStaticsI['assertPrimaryKeyField']>[0],
      operation: Parameters<ModelStaticsI['assertPrimaryKeyField']>[1],
    ): ReturnType<ModelStaticsI['assertPrimaryKeyField']> {
      return assertPrimaryKeyField(primaryKeyField, operation);
    }

    // Build methods
    public static build(
      data: Parameters<ModelStaticsI['build']>[0],
      params: Parameters<ModelStaticsI['build']>[1],
    ): ReturnType<ModelStaticsI['build']> {
      const ctx: BuildContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          ModelClass: Model as unknown as new () => Instance,
          schema,
          relationships: Model.relationships,
        };
      return buildFn(ctx, data, params);
    }

    public static buildFromRecord(
      record: Parameters<ModelStaticsI['buildFromRecord']>[0],
    ): ReturnType<ModelStaticsI['buildFromRecord']> {
      const ctx: BuildContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          ModelClass: Model as unknown as new () => Instance,
          schema,
          relationships: Model.relationships,
        };
      return buildFromRecordFn(ctx, record);
    }

    // CRUD methods
    public static async createOne(
      data: Parameters<ModelStaticsI['createOne']>[0],
      configuration?: Parameters<ModelStaticsI['createOne']>[1],
    ): ReturnType<ModelStaticsI['createOne']> {
      const ctx: CreateContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          Model: Model as unknown as NeogmaModel<
            Properties,
            RelatedNodesToAssociateI,
            MethodsI,
            any
          >,
          ModelClass: Model,
          queryRunner,
          getLabel: Model.getLabel,
          getRawLabels: Model.getRawLabels,
          build: Model.build,
          getRelationshipConfiguration:
            Model.getRelationshipConfiguration as CreateContext<
              Properties,
              RelatedNodesToAssociateI,
              MethodsI
            >['getRelationshipConfiguration'],
          getRelationshipModel: Model.getRelationshipModel,
          getRelationshipProperties: Model.getRelationshipProperties,
        };
      return createOneFn(ctx, data, configuration);
    }

    public static async createMany(
      data: Parameters<ModelStaticsI['createMany']>[0],
      configuration?: Parameters<ModelStaticsI['createMany']>[1],
    ): ReturnType<ModelStaticsI['createMany']> {
      const ctx: CreateContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          Model: Model as unknown as NeogmaModel<
            Properties,
            RelatedNodesToAssociateI,
            MethodsI,
            any
          >,
          ModelClass: Model,
          queryRunner,
          getLabel: Model.getLabel,
          getRawLabels: Model.getRawLabels,
          build: Model.build,
          getRelationshipConfiguration:
            Model.getRelationshipConfiguration as CreateContext<
              Properties,
              RelatedNodesToAssociateI,
              MethodsI
            >['getRelationshipConfiguration'],
          getRelationshipModel: Model.getRelationshipModel,
          getRelationshipProperties: Model.getRelationshipProperties,
        };
      return createManyFn(ctx, data, configuration);
    }

    public static async findMany(
      params?: Parameters<ModelStaticsI['findMany']>[0],
    ): ReturnType<ModelStaticsI['findMany']> {
      const ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI> = {
        queryRunner,
        modelName,
        schemaKeys,
        getLabel: Model.getLabel,
        buildFromRecord: Model.buildFromRecord,
      };
      return findManyFn(ctx, params);
    }

    public static async findOne(
      params?: Parameters<ModelStaticsI['findOne']>[0],
    ): ReturnType<ModelStaticsI['findOne']> {
      const ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI> = {
        queryRunner,
        modelName,
        schemaKeys,
        getLabel: Model.getLabel,
        buildFromRecord: Model.buildFromRecord,
      };
      return findOneFn(ctx, params);
    }

    public static async update<Return extends boolean = false>(
      data: Parameters<ModelStaticsI['update']>[0],
      params?: UpdateParams<Properties> & { return?: Return },
    ): Promise<
      UpdateResult<Properties, RelatedNodesToAssociateI, MethodsI, Return>
    > {
      const ctx: UpdateContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          queryRunner,
          getLabel: Model.getLabel,
          buildFromRecord: Model.buildFromRecord,
        };
      return updateFn(ctx, data, params) as Promise<
        UpdateResult<Properties, RelatedNodesToAssociateI, MethodsI, Return>
      >;
    }

    public static async delete(
      configuration?: Parameters<ModelStaticsI['delete']>[0],
    ): ReturnType<ModelStaticsI['delete']> {
      const ctx: DeleteContext = {
        queryRunner,
        getLabel: Model.getLabel,
      };
      return deleteNodes(ctx, configuration);
    }

    // Relationship CRUD methods
    public static async relateTo<
      Alias extends keyof RelatedNodesToAssociateI,
      Return extends boolean = false,
    >(params: {
      alias: Alias;
      where: RelateToWhereClause<Properties, RelatedNodesToAssociateI, Alias>;
      properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
      assertCreatedRelationships?: number;
      return?: Return;
      throwIfNoneCreated?: boolean;
      session?: GenericConfiguration['session'];
    }): Promise<
      RelateToResult<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        Alias,
        Return
      >
    > {
      const ctx: RelationshipCrudContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        queryRunner,
        getLabel: Model.getLabel,
        getRelationshipConfiguration: Model.getRelationshipConfiguration,
        getRelationshipByAlias: Model.getRelationshipByAlias,
        getRelationshipModel: Model.getRelationshipModel,
        getRelationshipProperties: Model.getRelationshipProperties,
        buildFromRecord: Model.buildFromRecord,
      };
      return relateToFn(ctx, params) as Promise<
        RelateToResult<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          Alias,
          Return
        >
      >;
    }

    public static async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(params: {
      alias: Alias;
      where?: FindRelationshipsWhereClause<
        Properties,
        RelatedNodesToAssociateI,
        Alias
      >;
      limit?: number;
      skip?: number;
      minHops?: number;
      maxHops?: number;
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
    }): Promise<
      Array<{
        source: Instance;
        target: RelatedNodesToAssociateI[Alias]['Instance'];
        relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
      }>
    > {
      const ctx: RelationshipCrudContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        queryRunner,
        getLabel: Model.getLabel,
        getRelationshipConfiguration: Model.getRelationshipConfiguration,
        getRelationshipByAlias: Model.getRelationshipByAlias,
        getRelationshipModel: Model.getRelationshipModel,
        getRelationshipProperties: Model.getRelationshipProperties,
        buildFromRecord: Model.buildFromRecord,
      };
      return findRelationshipsFn(ctx, params);
    }

    public static async deleteRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(params: {
      alias: Alias;
      where: DeleteRelationshipsWhereClause<
        Properties,
        RelatedNodesToAssociateI,
        Alias
      >;
      /** When true, throws NeogmaNotFoundError if no relationships were deleted. */
      throwIfNoneDeleted?: boolean;
      session?: GenericConfiguration['session'];
    }): Promise<number> {
      const ctx: RelationshipCrudContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        queryRunner,
        getLabel: Model.getLabel,
        getRelationshipConfiguration: Model.getRelationshipConfiguration,
        getRelationshipByAlias: Model.getRelationshipByAlias,
        getRelationshipModel: Model.getRelationshipModel,
        getRelationshipProperties: Model.getRelationshipProperties,
        buildFromRecord: Model.buildFromRecord,
      };
      return deleteRelationshipsFn(ctx, params);
    }

    public static async createRelationship(
      params: Parameters<ModelStaticsI['createRelationship']>[0],
    ): ReturnType<ModelStaticsI['createRelationship']> {
      return createRelationshipFn(queryRunner, params);
    }

    public static async updateRelationship<
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
        return?: Return;
        throwIfNoneUpdated?: boolean;
        session?: GenericConfiguration['session'];
      },
    ): Promise<
      UpdateRelationshipResult<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        Alias,
        Return
      >
    > {
      const ctx: RelationshipCrudContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        queryRunner,
        getLabel: Model.getLabel,
        getRelationshipConfiguration: Model.getRelationshipConfiguration,
        getRelationshipByAlias: Model.getRelationshipByAlias,
        getRelationshipModel: Model.getRelationshipModel,
        getRelationshipProperties: Model.getRelationshipProperties,
        buildFromRecord: Model.buildFromRecord,
      };
      return updateRelationshipFn(ctx, data, params) as Promise<
        UpdateRelationshipResult<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          Alias,
          Return
        >
      >;
    }

    // Instance methods
    public getDataValues(
      this: Instance,
    ): ReturnType<InstanceMethodsI['getDataValues']> {
      return getDataValuesFn(this, { schemaKeys: [...schemaKeys] });
    }

    public async validate(
      this: Instance,
    ): ReturnType<InstanceMethodsI['validate']> {
      const ctx: ValidateContext<Properties> = {
        schema,
        Model: Model as unknown as NeogmaModel<Properties, any, any, any>,
      };
      return validateFn(this.getDataValues(), ctx);
    }

    public async save(
      this: Instance,
      configuration?: Parameters<InstanceMethodsI['save']>[0],
    ): ReturnType<InstanceMethodsI['save']> {
      const ctx: SaveContext<Properties, RelatedNodesToAssociateI, MethodsI> = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        schemaKeys,
        primaryKeyField: modelPrimaryKeyField,
        assertPrimaryKeyField,
      };
      return saveFn(this, ctx, configuration);
    }

    public async delete(
      this: Instance,
      configuration?: Parameters<InstanceMethodsI['delete']>[0],
    ): ReturnType<InstanceMethodsI['delete']> {
      const ctx: InstanceDeleteContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        primaryKeyField: modelPrimaryKeyField,
        assertPrimaryKeyField,
      };
      return deleteInstance(this, ctx, configuration);
    }

    public async relateTo<
      Alias extends keyof RelatedNodesToAssociateI,
      Return extends boolean = false,
    >(
      this: Instance,
      params: InstanceRelateToParams<RelatedNodesToAssociateI, Alias> & {
        return?: Return;
      },
    ): Promise<
      RelateToResult<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        Alias,
        Return
      >
    > {
      const ctx: InstanceRelationshipContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        primaryKeyField: modelPrimaryKeyField,
        assertPrimaryKeyField,
      };
      return instanceRelateTo(this, ctx, params) as Promise<
        RelateToResult<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          Alias,
          Return
        >
      >;
    }

    public async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      this: Instance,
      params: InstanceFindRelationshipsParams<
        Properties,
        RelatedNodesToAssociateI,
        Alias
      >,
    ): Promise<
      Array<{
        source: Instance;
        target: RelatedNodesToAssociateI[Alias]['Instance'];
        relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
      }>
    > {
      const ctx: InstanceRelationshipContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        primaryKeyField: modelPrimaryKeyField,
        assertPrimaryKeyField,
      };
      return instanceFindRelationships(this, ctx, params);
    }

    public async updateRelationship<
      Alias extends keyof RelatedNodesToAssociateI,
      Return extends boolean = false,
    >(
      this: Instance,
      data: UpdateRelationshipData<RelatedNodesToAssociateI, Alias>,
      params: InstanceUpdateRelationshipParams<
        RelatedNodesToAssociateI,
        Alias
      > & {
        return?: Return;
      },
    ): Promise<
      UpdateRelationshipResult<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        Alias,
        Return
      >
    > {
      const ctx: InstanceRelationshipContext<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
      > = {
        Model: Model as unknown as NeogmaModel<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          any
        >,
        primaryKeyField: modelPrimaryKeyField,
        assertPrimaryKeyField,
      };
      return instanceUpdateRelationship(this, ctx, data, params) as Promise<
        UpdateRelationshipResult<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          Alias,
          Return
        >
      >;
    }
  };

  // Add statics
  for (const staticKey in statics) {
    if (!Object.hasOwn(statics, staticKey)) {
      continue;
    }
    Model[staticKey as keyof typeof Model] = statics[staticKey];
  }

  // Add methods
  for (const methodKey in methods) {
    if (!Object.hasOwn(methods, methodKey)) {
      continue;
    }
    Model.prototype[methodKey as keyof typeof Model.prototype] =
      methods[methodKey];
  }

  // Add to modelsByName
  neogma.modelsByName[modelName] = Model;

  return Model as unknown as NeogmaModel<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    StaticsI
  >;
};
