import { Neo4jSupportedProperties } from 'Queries';
import { NeogmaModelMetadata, PropertySchema } from './data-types';
import { getModelName, getOptions } from './model-service';
import { getProperties } from './property-service';
import { getRelations } from './relation-service';
import { NeogmaModel } from '../../ModelOps';

type AnyObject = Record<string, any>;

type RelationshipsI<RelatedNodesToAssociateI extends AnyObject> = {
  /** the alias of the relationship definitions is the key */
  [alias in keyof RelatedNodesToAssociateI]: {
    /** the related model. It could be the object of the model, or "self" for this model */
    model: NeogmaModel<any, any, any, any> | 'self';
    /** the name of the relationship */
    name: string;
    /** the direction of the relationship */
    direction: 'out' | 'in' | 'none';
    /** relationship properties */
    properties?: {
      /** the alias of the relationship property is the key */
      [relationshipPropertyAlias in keyof RelatedNodesToAssociateI[alias]['CreateRelationshipProperties']]: {
        /** the actual property to be used on the relationship */
        property: keyof RelatedNodesToAssociateI[alias]['RelationshipProperties'];
        /** validation for the property */
        schema: Revalidator.ISchema<AnyObject>;
      };
    };
  };
};

export type NeogmaModelFactoryParams<
  Properties extends Neo4jSupportedProperties,
  /** related nodes to associate. Label-ModelRelatedNodesI pairs */
  RelatedNodesToAssociateI extends AnyObject = Object,
  /** interface for the statics of the model */
  StaticsI extends AnyObject = Object,
  /** interface for the methods of the instance */
  MethodsI extends AnyObject = Object,
> = {
  /** the schema for the validation */
  schema: {
    [index in keyof Properties]:
      | Revalidator.ISchema<Properties>
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
};

export const getModelMetadata = (target: any) => {
  return {
    name: getModelName(target.prototype),
    options: getOptions(target.prototype),
    properties: getProperties(target.prototype),
    relations: getRelations(target.prototype),
  } as NeogmaModelMetadata;
};

export const parseModelMetadata = <
  Properties extends Neo4jSupportedProperties,
  /** related nodes to associate. Label-ModelRelatedNodesI pairs */
  RelatedNodesToAssociateI extends AnyObject = Object,
  /** interface for the statics of the model */
  StaticsI extends AnyObject = Object,
  /** interface for the methods of the instance */
  MethodsI extends AnyObject = Object,
>(
  metadata: NeogmaModelMetadata,
): NeogmaModelFactoryParams<
  Properties,
  RelatedNodesToAssociateI,
  StaticsI,
  MethodsI
> => {
  const { name, properties, relations } = metadata;
  const propertyNames = Object.keys(properties);
  const props = propertyNames.map((propertyName) => {
    const property = properties[propertyName];
    return {
      [propertyName]: property.schema as PropertySchema,
    };
  });
  const parsedProperties = Object.assign({}, ...props);

  const relationNames = Object.keys(relations);
  const rels = relationNames.map((relationName) => {
    const relation = relations[relationName];
    return {
      [relationName]: relation,
    };
  });
  const parsedRelations = Object.assign({}, ...rels);
  return {
    label: name,
    schema: parsedProperties,
    relationships: parsedRelations,
  };
};
