/* eslint-disable @typescript-eslint/ban-types */
import {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModelStaticsI,
} from '../../ModelOps';
import { Neo4jSupportedProperties, Neo4jSupportedTypes } from '../../Queries';

export type AnyObject = Record<string, any>;

export type PropertySchema = Revalidator.ISchema<Neo4jSupportedProperties>;

export type DataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'object'
  | 'null'
  | 'any';

export interface NodeProperties {
  [propertyName: string]: Neo4jSupportedTypes;
}

export interface NodeRelations {
  [propertyName: string]: ModelRelatedNodesI<
    object & { createOne: NeogmaModelStaticsI<any>['createOne'] },
    NodeInstance
  >;
}

export interface NodeMethods {
  [propertyName: string]: <T>(this: NodeInstance) => T;
}

export interface NodeStatics {
  [propertyName: string]: Function;
}

export type NodeInstance = NeogmaInstance<
  NodeProperties,
  NodeRelations,
  NodeMethods
>;

export interface NeogmaNodeMetadata {
  name: string;
  options: NodeClassDecoratorOptions;
  properties: {
    [propertyName: string]: NodePropertyDecoratorOptions;
  };
  relationships: {
    [relationAlias: string]: NodeRelationshipDecoratorOptions;
  };
  methods: NodeMethodDecoratorOptions;
  statics: NodeStaticDecoratorOptions;
}

export interface NodeClassDecoratorOptions {
  label?: string;
}

export interface NodePropertyDecoratorOptions {
  get?<M>(this: M): unknown;
  set?<M>(this: M, val: unknown): void;
  schema: PropertySchema;
}

export type NodeRelationshipDecoratorOptions = {
  model: Object | 'self';
  name: string;
  direction: 'out' | 'in' | 'none';
  properties?: {
    [propertyName: string]: {
      property: string;
      schema: PropertySchema;
    };
  };
};
export type NodeMethodDecoratorOptions = {};
export type NodeStaticDecoratorOptions = {};
