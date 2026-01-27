import type { NeogmaInstance } from '..';
import { ModelFactory } from '..';
import type { ModelRelatedNodesI } from '../ModelFactory';
import { Neogma } from '../Neogma';
import type { QueryBuilder } from './QueryBuilder';

// Shared neogma instance
export const neogma = new Neogma({
  url: process.env.NEO4J_URL ?? '',
  username: process.env.NEO4J_USERNAME ?? '',
  password: process.env.NEO4J_PASSWORD ?? '',
});

// Model A types and factory
export type ModelAAttributesI = {
  name: string;
  id: string;
};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModelARelatedNodesI {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModelAMethodsI {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModelAStaticsI {}

export type ModelAInstance = NeogmaInstance<
  ModelAAttributesI,
  ModelARelatedNodesI,
  ModelAMethodsI
>;

export const ModelA = ModelFactory<
  ModelAAttributesI,
  ModelARelatedNodesI,
  ModelAStaticsI,
  ModelAMethodsI
>(
  {
    label: 'ModelA',
    schema: {
      name: {
        type: 'string',
        minLength: 3,
        required: true,
      },
      id: {
        type: 'string',
        required: true,
      },
    },
    relationships: [],
    primaryKeyField: 'id',
    statics: {},
    methods: {},
  },
  neogma,
);

// Model B types and factory
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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModelBMethodsI {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModelBStaticsI {}

export const ModelB = ModelFactory<
  ModelBAttributesI,
  ModelBRelatedNodesI,
  ModelBStaticsI,
  ModelBMethodsI
>(
  {
    label: 'ModelB',
    schema: {
      name: {
        type: 'string',
        minLength: 3,
        required: true,
      },
      id: {
        type: 'string',
        required: true,
      },
      age: {
        type: 'number',
        required: true,
      },
    },
    relationships: {
      ModelA: {
        direction: 'out',
        model: ModelA,
        name: 'RELNAME',
        properties: {
          Available: {
            property: 'available',
            schema: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
    primaryKeyField: 'id',
    statics: {},
    methods: {},
  },
  neogma,
);

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
