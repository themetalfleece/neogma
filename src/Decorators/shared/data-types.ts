/* eslint-disable @typescript-eslint/ban-types */
import {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModelStaticsI,
} from '../../ModelOps';
import { Neo4jSupportedProperties, Neo4jSupportedTypes } from '../../Queries';

export type PropertySchema =
  | Revalidator.ISchema<Neo4jSupportedProperties>
  | Revalidator.JSONSchema<Neo4jSupportedProperties>;

export type DataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'object'
  | 'null'
  | 'any';

export interface ModelProperties {
  [propertyName: string]: Neo4jSupportedTypes;
}

export interface ModelRelations {
  [propertyName: string]: ModelRelatedNodesI<
    object & { createOne: NeogmaModelStaticsI<any>['createOne'] },
    ModelInstance
  >;
}

export interface ModelMethods {
  [propertyName: string]: <T>(this: ModelInstance) => T;
}

export interface ModelStatics {
  [propertyName: string]: Function;
}

export type ModelInstance = NeogmaInstance<
  ModelProperties,
  ModelRelations,
  ModelMethods
>;

export interface NeogmaModelMetadata {
  name: string;
  options: ModelClassDecoratorOptions;
  properties: ModelPropertyDecoratorOptions;
  relations: {
    [relationAlias: string]: ModelRelationDecoratorOptions;
  };
  methods: ModelMethodDecoratorOptions;
  statics: ModelStaticDecoratorOptions;
}

export interface ModelClassDecoratorOptions {
  label?: string;
  connection?: string;
}

export interface ModelPropertyDecoratorOptions {
  get?<M>(this: M): unknown;
  set?<M>(this: M, val: unknown): void;
  schema: PropertySchema;
}

export type ModelRelationDecoratorOptions = {
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
export type ModelMethodDecoratorOptions = {};
export type ModelStaticDecoratorOptions = {};
