import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { NeogmaInstance, NeogmaModel } from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';
import type { RelationshipsLoadConfig } from './eagerLoading.types';

export interface FindContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  queryRunner: QueryRunner;
  modelName: string;
  schemaKeys: Set<string>;
  getLabel: () => string;
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
  /** Required when using relationships parameter */
  getRelationshipByAlias?: <Alias extends keyof RelatedNodesToAssociateI>(
    alias: Alias,
  ) => {
    name: string;
    direction: 'in' | 'out' | 'none';
    model: NeogmaModel<any, any, any, any> | 'self';
  };
  /** Required when using relationships parameter */
  getRelationshipModel?: (
    model: NeogmaModel<any, any, any, any> | 'self',
  ) => NeogmaModel<any, any, any, any>;
}

export interface FindManyParams<
  Properties,
  RelatedNodesToAssociateI extends AnyObject = AnyObject,
> extends GenericConfiguration {
  where?: WhereParamsI<Properties>;
  limit?: number;
  skip?: number;
  order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
  /**
   * Returns an array of the plain properties, instead of Instances.
   * When `relationships` is provided, includes them on each plain object.
   */
  plain?: boolean;
  /** throws an error if no nodes are found (results length 0) */
  throwIfNoneFound?: boolean;
  /**
   * Relationships to eagerly load with the results.
   * Each key is a relationship alias defined on the model.
   *
   * @example
   * ```typescript
   * const users = await Users.findMany({
   *   where: { status: 'active' },
   *   relationships: {
   *     Orders: {
   *       where: { target: { status: 'completed' } },
   *       limit: 10,
   *       relationships: {
   *         Products: { limit: 5 }
   *       }
   *     }
   *   }
   * });
   * ```
   */
  relationships?: RelationshipsLoadConfig<RelatedNodesToAssociateI>;
}
