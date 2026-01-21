import clone from 'clone';

import { Neogma } from '../Neogma';
import { Neo4jSupportedProperties, QueryBuilder } from '../Queries';
import type { WhereParamsI } from '../Queries/Where';
// Import operations from new directories
import {
  build as buildFn,
  BuildContext,
  buildFromRecord as buildFromRecordFn,
} from './build';
import { CreateContext, createMany as createManyFn } from './createMany';
import { createOne as createOneFn } from './createOne';
import { createRelationship as createRelationshipFn } from './createRelationship';
import { DeleteContext, deleteNodes, InstanceDeleteContext } from './delete';
import { deleteInstance } from './delete';
import { deleteRelationships as deleteRelationshipsFn } from './deleteRelationships';
import { FindContext, findMany as findManyFn } from './findMany';
import { findOne as findOneFn } from './findOne';
import { findRelationships as findRelationshipsFn } from './findRelationships';
import { instanceFindRelationships } from './findRelationships';
import { getDataValues as getDataValuesFn } from './getDataValues';
import type {
  NeogmaInstance,
  NeogmaInstanceMethodsI,
  NeogmaModel,
  NeogmaModelStaticsI,
  RelationshipsI,
  StrictNeogmaInstance,
} from './model.types';
import {
  InstanceRelationshipContext,
  relateTo as relateToFn,
  RelationshipCrudContext,
} from './relateTo';
import { instanceRelateTo } from './relateTo';
import {
  addRelationships as addRelationshipsFn,
  getRelationshipByAlias as getRelationshipByAliasFn,
  getRelationshipConfiguration as getRelationshipConfigurationFn,
  getRelationshipProperties as getRelationshipPropertiesFn,
  RelationshipConfigContext,
  reverseRelationshipConfiguration as reverseRelationshipConfigurationFn,
} from './relationshipConfig';
import { save as saveFn, SaveContext } from './save';
import type {
  AnyObject,
  GenericConfiguration,
  IValidationSchema,
} from './shared.types';
import { update as updateFn, UpdateContext } from './update';
import { updateRelationship as updateRelationshipFn } from './updateRelationship';
import { instanceUpdateRelationship } from './updateRelationship';
import {
  assertPrimaryKeyField,
  getLabelFromRelationshipModel,
  getRelationshipModel,
} from './utils';
import { validate as validateFn, ValidateContext } from './validate';

/**
 * A function which returns a class with the model operation functions for the given Properties.
 * RelatedNodesToAssociateI are the corresponding Nodes for Relationships.
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

    public static async update(
      data: Parameters<ModelStaticsI['update']>[0],
      params?: Parameters<ModelStaticsI['update']>[1],
    ): ReturnType<ModelStaticsI['update']> {
      const ctx: UpdateContext<Properties, RelatedNodesToAssociateI, MethodsI> =
        {
          queryRunner,
          getLabel: Model.getLabel,
          buildFromRecord: Model.buildFromRecord,
        };
      return updateFn(ctx, data, params);
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
    >(params: {
      alias: Alias;
      where: {
        source: WhereParamsI;
        target: WhereParamsI;
      };
      properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
      assertCreatedRelationships?: number;
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
      return relateToFn(ctx, params);
    }

    public static async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(params: {
      alias: Alias;
      where?: {
        source?: WhereParamsI;
        target?: WhereParamsI;
        relationship?: WhereParamsI;
      };
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
      where: {
        source?: WhereParamsI;
        target?: WhereParamsI;
        relationship?: WhereParamsI;
      };
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

    public static async updateRelationship(
      data: Parameters<ModelStaticsI['updateRelationship']>[0],
      params: Parameters<ModelStaticsI['updateRelationship']>[1],
    ): ReturnType<ModelStaticsI['updateRelationship']> {
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
      return updateRelationshipFn(ctx, data, params);
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

    public async relateTo<Alias extends keyof RelatedNodesToAssociateI>(
      this: Instance,
      params: {
        alias: Alias;
        where: WhereParamsI;
        properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
        assertCreatedRelationships?: number;
        session?: GenericConfiguration['session'];
      },
    ): Promise<number> {
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
      return instanceRelateTo(this, ctx, params);
    }

    public async findRelationships<
      Alias extends keyof RelatedNodesToAssociateI,
    >(
      this: Instance,
      params: Parameters<InstanceMethodsI['findRelationships']>[0],
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

    public async updateRelationship(
      this: Instance,
      data: Parameters<InstanceMethodsI['updateRelationship']>[0],
      params: Parameters<InstanceMethodsI['updateRelationship']>[1],
    ): ReturnType<InstanceMethodsI['updateRelationship']> {
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
      return instanceUpdateRelationship(this, ctx, data, params);
    }
  };

  // Add statics
  for (const staticKey in statics) {
    if (!Object.prototype.hasOwnProperty.call(statics, staticKey)) {
      continue;
    }
    Model[staticKey as keyof typeof Model] = statics[staticKey];
  }

  // Add methods
  for (const methodKey in methods) {
    if (!Object.prototype.hasOwnProperty.call(methods, methodKey)) {
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
