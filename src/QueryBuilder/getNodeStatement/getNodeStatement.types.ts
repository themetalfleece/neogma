import type { BindParam } from '../../BindParam';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { Where } from '../../Where';

export interface GetNodeStatementParams {
  /** identifier for the node */
  identifier?: string;
  /** identifier for the label */
  label?: string;
  /** a statement to be used inside the node, like a where condition or properties */
  inner?:
    | string
    | Where
    | {
        properties: Neo4jSupportedProperties;
        bindParam: BindParam;
      };
}
