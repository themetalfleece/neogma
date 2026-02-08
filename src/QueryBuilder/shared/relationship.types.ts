import type { Neo4jSupportedProperties } from '../../QueryRunner/QueryRunner.types';
import type { WhereParamsI } from '../../Where';

/** relationship type used for matching */
export type RelationshipForMatchI = string | RelationshipForMatchObjectI;
export type RelationshipForMatchObjectI = {
  /** direction of this relationship, from top to bottom */
  direction: 'in' | 'out' | 'none';
  /** name of this relationship */
  name?: string;
  /** identifier for this relationship */
  identifier?: string;
  /** where parameters for matching this relationship */
  where?: WhereParamsI;
  /** variable length relationship: minimum hops */
  minHops?: number;
  /** variable length relationship: maximum hops */
  maxHops?: number;
};

/** relationship type used for creating/merging */
export type RelationshipForCreateI = string | RelationshipForCreateObjectI;
export type RelationshipForCreateObjectI = {
  /** direction of this relationship, from top to bottom */
  direction: 'in' | 'out' | 'none';
  /** name of this relationship */
  name: string;
  /** identifier for this relationship */
  identifier?: string;
  /** properties of the relationship */
  properties?: Neo4jSupportedProperties;
  /** variable length relationship: minimum hops */
  minHops?: number;
  /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
  maxHops?: number;
};
