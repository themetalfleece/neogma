import Type from 'typebox';

import type { NeogmaInstance } from '..';
import {
  Node,
  NodeEntity,
  Property,
  Relationship,
  toModel,
} from '../Decorators';
import type { ModelRelatedNodesI } from '../ModelFactory';
import { Neogma } from '../Neogma';
import type { QueryBuilder } from './QueryBuilder';

// Shared neogma instance
export const neogma = new Neogma({
  url: process.env.NEO4J_URL ?? '',
  username: process.env.NEO4J_USERNAME ?? '',
  password: process.env.NEO4J_PASSWORD ?? '',
});

// Model A types
export type ModelAAttributesI = {
  name: string;
  id: string;
};
export type ModelARelatedNodesI = object;
export type ModelAMethodsI = object;
export type ModelAStaticsI = object;

export type ModelAInstance = NeogmaInstance<
  ModelAAttributesI,
  ModelARelatedNodesI,
  ModelAMethodsI
>;

// Model B types
export type ModelBAttributesI = {
  name: string;
  id: string;
  age: number;
};

export interface ModelBRelatedNodesI {
  ModelA: ModelRelatedNodesI<
    typeof ModelA,
    ModelAInstance,
    {
      Available: number;
    },
    {
      available: number;
    }
  >;
}

export type ModelBMethodsI = object;
export type ModelBStaticsI = object;

// Decorated class definitions

@Node({ label: 'ModelA', primaryKeyField: 'id' })
class ModelANode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.String())
  id!: string;
}

@Node({ label: 'ModelB', primaryKeyField: 'id' })
class ModelBNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.String())
  id!: string;

  @Property(Type.Number())
  age!: number;

  @Relationship({
    name: 'RELNAME',
    direction: 'out',
    model: () => ModelANode,
    properties: [
      {
        alias: 'Available',
        property: 'available',
        schema: Type.Number(),
      },
    ],
  })
  ModelA!: any;
}

// Create models via decorators. The decorator registry keys models by class
// identity, so the locally-scoped ModelANode/ModelBNode declarations above
// cannot collide with models registered by other test helper modules.
export const ModelA = toModel<
  ModelAAttributesI,
  ModelARelatedNodesI,
  ModelAStaticsI,
  ModelAMethodsI
>(ModelANode, neogma);

export const ModelB = toModel<
  ModelBAttributesI,
  ModelBRelatedNodesI,
  ModelBStaticsI,
  ModelBMethodsI
>(ModelBNode, neogma);

// Test helper functions
export const expectStatementEquals = (
  queryBuilder: QueryBuilder,
  expected: string,
) => {
  expect(queryBuilder.getStatement()).toEqual(expected);
};

export const expectBindParamEquals = (
  queryBuilder: QueryBuilder,
  target: Record<string, unknown>,
) => {
  expect(queryBuilder.getBindParam().get()).toEqual(target);
};
