import type { BindParam } from '../../BindParam';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { Where } from '../../Where';

export interface GetRelationshipStatementParams {
  /** relationship direction */
  direction: 'in' | 'out' | 'none';
  /** relationship name */
  name?: string;
  /** relationship identifier. If empty, no identifier will be used */
  identifier?: string;
  /** variable length relationship: minimum hops */
  minHops?: number;
  /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
  maxHops?: number;
  /** a statement to be used inside the relationship, like a where condition or properties */
  inner?:
    | string
    | Where
    | {
        properties: Neo4jSupportedProperties;
        bindParam: BindParam;
      };
}
