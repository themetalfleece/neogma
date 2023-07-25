/* eslint-disable @typescript-eslint/ban-types */
import { Neo4jSupportedTypes } from '../Queries';
import {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModelStaticsI,
} from '../ModelOps';
import { PropertySchema } from './lib/model/shared/data-types';

export interface ModelProperties {
  [propertyName: string]: Neo4jSupportedTypes;
}

export interface ModelRelationships {
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
  ModelRelationships,
  ModelMethods
>;

export interface NeogmaModelMetadata {
  name: string;
  options: ModelClassDecoratorOptions;
  properties: ModelProperties;
  relationships: ModelRelationships;
  methods: ModelMethods;
  statics: ModelStatics;
}

export interface ModelClassDecoratorOptions {
  label?: string;
  connection?: string;
}
export type ModelMethodDecoratorOptions = {};
export interface ModelPropertyDecoratorOptions {
  get?<M>(this: M): unknown;
  set?<M>(this: M, val: unknown): void;
  schema: PropertySchema;
}
export type ModelRelationshipDecoratorOptions = {};
export type ModelStaticDecoratorOptions = {};
