import { BindParam } from '../../BindParam';
import { Neo4jSupportedProperties } from '../../QueryRunner';

export interface GetSetPartsParams {
  /** properties to set */
  data: Neo4jSupportedProperties;
  /** bind param to use */
  bindParam: BindParam;
  /** identifier to use */
  identifier: string;
}

export interface GetSetPartsResult {
  parts: string[];
  statement: string;
}
