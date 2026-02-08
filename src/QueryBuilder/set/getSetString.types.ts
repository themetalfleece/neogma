import type { BindParam } from '../../BindParam';
import type { Neo4jSupportedProperties } from '../../QueryRunner/QueryRunner.types';

export type SetObjectI = {
  /** identifier whose properties will be set */
  identifier: string;
  /** properties to set */
  properties: Neo4jSupportedProperties;
};

/** SET parameter */
export type SetI = {
  /** SET parameter */
  set: string | SetObjectI;
};

export type GetSetStringSet = SetI['set'];

export interface GetSetStringDeps {
  bindParam: BindParam;
}
