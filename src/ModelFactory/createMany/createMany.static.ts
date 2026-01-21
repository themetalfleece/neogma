import { BindParam } from '../../BindParam/BindParam';
import { NeogmaError } from '../../Errors/NeogmaError';
import { QueryBuilder, QueryBuilderParameters } from '../../QueryBuilder';
import { Neo4jSupportedProperties } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type {
  CreateDataI,
  CreateDataParamsI,
  NeogmaInstance,
  NeogmaModel,
  RelationshipsI,
  RelationshipTypePropertyForCreateI,
} from '../model.types';
import type { AnyObject } from '../shared.types';
import type { CreateContext } from './createMany.types';

/**
 * Creates multiple nodes with optional related nodes and relationships.
 */
export async function createMany<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  ctx: CreateContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: Array<CreateDataI<Properties, RelatedNodesToAssociateI>>,
  configuration?: CreateDataParamsI,
): Promise<
  Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>
> {
  configuration = configuration || {};
  const validate = !(configuration.validate === false);

  // used only for unique names
  const identifiers = new BindParam();

  /** identifiers and the where/relationship configuration for a relationship to be created */
  const toRelateByIdentifier: {
    [identifier: string]: Array<{
      where: WhereParamsI;
      relationship: RelationshipsI<any>[0];
      properties?: AnyObject;
      merge?: boolean;
    }>;
  } = {};

  const rootInstances: Array<
    NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>
  > = [];
  const bulkCreateData: Properties[] = [];

  /** parameters for the QueryBuilder */
  const queryBuilderParams: Array<QueryBuilderParameters['ParameterI']> = [];
  /** Bind Param which will be used in the QueryBuilder, and in creating parameters for literals */
  const bindParam = new BindParam();

  /** count the number of relationships created by properties */
  let relationshipsCreatedByProperties = 0;

  const addCreateToStatement = async (
    _model: NeogmaModel<any, any, object, object>,
    dataToUse: Array<
      | CreateDataI<Properties, RelatedNodesToAssociateI>
      | NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>
    >,
    mergeProperties?: boolean,
    parentNode?: {
      identifier: string;
      relationship: RelationshipsI<any>[0];
      mergeRelationship?: boolean;
    },
  ) => {
    const model = _model as NeogmaModel<any, any>;

    for (const createData of dataToUse) {
      const identifier = identifiers.getUniqueNameAndAdd('node', null);
      const label = model.getLabel();

      const isCreateDataAnInstanceOfModel =
        createData instanceof ctx.ModelClass;
      const instance = (
        isCreateDataAnInstanceOfModel
          ? createData
          : model.build(createData, { status: 'new' })
      ) as NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI> &
        Partial<RelatedNodesToAssociateI>;

      if (!isCreateDataAnInstanceOfModel) {
        instance.labels = ctx.getRawLabels();
      }

      await model.beforeCreate?.(instance);

      if (validate) {
        await instance.validate();
      }

      instance.__existsInDatabase = true;
      for (const key in instance.changed) {
        if (!Object.prototype.hasOwnProperty.call(instance.changed, key)) {
          continue;
        }
        instance.changed[key as keyof Properties] = false;
      }

      if (!parentNode) {
        rootInstances.push(instance);
      }

      const relatedNodesToAssociate: {
        [key: string]: RelationshipTypePropertyForCreateI<any, any> | undefined;
      } = {};
      for (const alias of Object.keys(model.relationships)) {
        if ((instance as AnyObject)[alias]) {
          relatedNodesToAssociate[alias] = (instance as AnyObject)[alias];
        }
      }

      if (
        Object.keys(relatedNodesToAssociate).length > 0 ||
        parentNode ||
        mergeProperties
      ) {
        const createOrMergeProperties:
          | QueryBuilderParameters['CreateI']
          | QueryBuilderParameters['MergeI'] = {
          identifier,
          label,
          properties: instance.getDataValues(),
        };
        if (mergeProperties) {
          queryBuilderParams.push({ merge: createOrMergeProperties });
        } else {
          queryBuilderParams.push({ create: createOrMergeProperties });
        }

        if (parentNode) {
          const { relationship, identifier: parentIdentifier } = parentNode;

          const relatedQueryBuilderParameters:
            | QueryBuilderParameters['CreateI']
            | QueryBuilderParameters['MergeI'] = {
            related: [
              { identifier: parentIdentifier },
              {
                direction: relationship.direction,
                name: relationship.name,
                properties:
                  model.getRelationshipProperties(relationship, createData) ||
                  null,
              },
              { identifier },
            ],
          };

          if (mergeProperties) {
            queryBuilderParams.push({ merge: relatedQueryBuilderParameters });
          } else {
            queryBuilderParams.push({ create: relatedQueryBuilderParameters });
          }
        }

        for (const relationshipAlias in relatedNodesToAssociate) {
          const relatedNodesData = relatedNodesToAssociate[relationshipAlias];
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

              const relationshipProperties = model.getRelationshipProperties(
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
        bulkCreateData.push(instance.getDataValues() as Properties);
      }
    }
  };

  await addCreateToStatement(
    ctx.Model as unknown as NeogmaModel<any, any>,
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
          label: ctx.getLabel(),
        },
      },
      {
        set: `${bulkCreateIdentifier} += ${bulkCreateDataIdentifier}`,
      },
    );
  }

  // parse toRelateByIdentifier
  for (const identifier of Object.keys(toRelateByIdentifier)) {
    const allNeededIdentifiers = Object.keys(toRelateByIdentifier);
    for (const relateParameters of toRelateByIdentifier[identifier]) {
      const relationship = relateParameters.relationship;
      const relationshipIdentifier = identifiers.getUniqueNameAndAdd('r', null);
      const targetNodeModel = ctx.getRelationshipModel(relationship.model);
      const targetNodeLabel = targetNodeModel.getLabel();
      const targetNodeIdentifier = identifiers.getUniqueNameAndAdd(
        'targetNode',
        null,
      );

      const relatedQueryBuilderParameters:
        | QueryBuilderParameters['CreateI']
        | QueryBuilderParameters['MergeI'] = {
        related: [
          { identifier },
          {
            direction: relationship.direction,
            name: relationship.name,
            identifier: relationshipIdentifier,
          },
          { identifier: targetNodeIdentifier },
        ],
      };

      queryBuilderParams.push(
        { with: `DISTINCT ${allNeededIdentifiers.join(', ')}` },
        {
          match: {
            identifier: targetNodeIdentifier,
            label: targetNodeLabel,
          },
        },
        { where: { [targetNodeIdentifier]: relateParameters.where } },
        relateParameters.merge
          ? { merge: relatedQueryBuilderParameters }
          : { create: relatedQueryBuilderParameters },
      );

      if (
        relateParameters.properties &&
        Object.keys(relateParameters.properties).length > 0
      ) {
        const relationshipPropertiesParam = bindParam.getUniqueNameAndAdd(
          'relationshipProperty',
          relateParameters.properties,
        );

        queryBuilderParams.push({
          set: `${relationshipIdentifier} += $${relationshipPropertiesParam}`,
        });
      }

      toRelateByIdentifier[identifier] = toRelateByIdentifier[
        identifier
      ].filter((r) => r !== relateParameters);
    }
    delete toRelateByIdentifier[identifier];
  }

  // create a QueryBuilder instance, add the params and run it
  const res = await new QueryBuilder(bindParam)
    .addParams(queryBuilderParams)
    .run(ctx.queryRunner, configuration?.session);

  const { assertRelationshipsOfWhere } = configuration;
  if (assertRelationshipsOfWhere) {
    const relationshipsCreated =
      res.summary.counters.updates().relationshipsCreated;
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
