import type { BindParam } from '../../BindParam';
import type { Neo4jSupportedProperties } from '../../QueryRunner/QueryRunner.types';
import { isPlainObject } from '../../utils/object';

/**
 * Parameters for the ON CREATE SET clause.
 * Used with MERGE to specify what happens when a new node is created.
 */
export type OnCreateSetI = {
  /** ON CREATE SET parameter */
  onCreateSet: string | OnCreateSetObjectI;
};

/**
 * Object form of ON CREATE SET.
 * Specifies the identifier and properties to set when a node is created.
 */
export type OnCreateSetObjectI = {
  /** identifier whose properties will be set on create */
  identifier: string;
  /** properties to set when the node is created */
  properties: Neo4jSupportedProperties;
};

/**
 * Dependencies required for generating the ON CREATE SET string.
 */
export interface GetOnCreateSetStringDeps {
  /** bind param instance to use for parameter binding */
  bindParam: BindParam;
}

/**
 * Type for the set parameter of getOnCreateSetString.
 */
export type GetOnCreateSetStringSet = OnCreateSetI['onCreateSet'];

/**
 * Type guard for checking if the onCreateSet parameter is a valid OnCreateSetObjectI.
 * Validates that it has a non-empty identifier string and valid properties object.
 * @param param - The parameter to check
 * @returns True if the parameter is a valid OnCreateSetObjectI
 */
export const isOnCreateSetObject = (
  param: OnCreateSetI['onCreateSet'],
): param is OnCreateSetObjectI => {
  if (typeof param === 'string') {
    return false;
  }
  const obj = param as OnCreateSetObjectI;
  return (
    typeof obj.identifier === 'string' &&
    obj.identifier.trim().length > 0 &&
    isPlainObject(obj.properties)
  );
};
