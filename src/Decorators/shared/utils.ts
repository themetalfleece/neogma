/* eslint-disable @typescript-eslint/ban-types */
import { Neo4jSupportedProperties } from 'Queries';
import { NeogmaNodeMetadata, PropertySchema } from './data-types';
import { getNodeName, getOptions } from './node-service';
import { getProperties } from './property-service';
import { getRelations } from './relationship-service';
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
      [relationPropertyAlias in keyof RelatedNodesToAssociateI[alias]['CreateRelationshipProperties']]: {
        /** the actual property to be used on the relationship */
        property: keyof RelatedNodesToAssociateI[alias]['RelationshipProperties'];
        /** validation for the property */
        schema: Revalidator.ISchema<AnyObject>;
      };
    };
  };
};

export type NeogmaNodeFactoryParams<
  Properties extends Neo4jSupportedProperties,
  /** related nodes to associate. Label-NodeRelatedNodesI pairs */
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
  /** statics of the Node */
  statics?: Partial<StaticsI>;
  /** method of the Instance */
  methods?: Partial<MethodsI>;
  /** the id key of this model. Is required in order to perform specific instance methods */
  primaryKeyField?: Extract<keyof Properties, string>;
  /** relationships with other models or itself. Alternatively, relationships can be added using Node.addRelationships */
  relationships?: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
};

export const getNodeMetadata = (target: Object | string) => {
  if (typeof target === 'string') {
    return {
      name: getNodeName(target),
      options: getOptions(target),
      properties: getProperties(target),
      relationships: getRelations(target),
    } as NeogmaNodeMetadata;
  } else {
    return {
      name: getNodeName(target['prototype']),
      options: getOptions(target['prototype']),
      properties: getProperties(target['prototype']),
      relationships: getRelations(target['prototype']),
    } as NeogmaNodeMetadata;
  }
};

export const getRelatedNodeMetadata = (target: Object | Function) => {
  return {
    name: getNodeName(target),
    options: getOptions(target),
    properties: getProperties(target),
    relationships: getRelations(target),
  } as NeogmaNodeMetadata;
};

export const parseNodeMetadata = <
  Properties extends Neo4jSupportedProperties,
  /** related nodes to associate. Label-NodeRelatedNodesI pairs */
  RelatedNodesToAssociateI extends AnyObject = Object,
  /** interface for the statics of the model */
  StaticsI extends AnyObject = Object,
  /** interface for the methods of the instance */
  MethodsI extends AnyObject = Object,
>(
  metadata: NeogmaNodeMetadata,
): NeogmaNodeFactoryParams<
  Properties,
  RelatedNodesToAssociateI,
  StaticsI,
  MethodsI
> => {
  const { name, properties, relationships } = metadata;
  const propertyNames = Object.keys(properties);
  const props = propertyNames.map((propertyName) => {
    const property = properties[propertyName];
    return {
      [propertyName]: property.schema as PropertySchema,
    };
  });
  const parsedProperties = Object.assign({}, ...props);

  let parsedRelations = undefined;

  if (relationships) {
    const relationNames = Object.keys(relationships);
    const rels = relationNames.map((relationName) => {
      const relationship = relationships[relationName];
      return {
        [relationName]: relationship,
      };
    });
    parsedRelations = Object.assign({}, ...rels);
  }

  return {
    label: name,
    schema: parsedProperties,
    relationships: parsedRelations,
  } as NeogmaNodeFactoryParams<
    Properties,
    RelatedNodesToAssociateI,
    StaticsI,
    MethodsI
  >;
};
