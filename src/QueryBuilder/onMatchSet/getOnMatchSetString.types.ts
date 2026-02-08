import type { BindParam } from '../../BindParam';
import type { Neo4jSupportedProperties } from '../../QueryRunner/QueryRunner.types';

/**
 * Parameters for the ON MATCH SET clause.
 * Used with MERGE to specify what happens when an existing node is matched.
 */
export type OnMatchSetI = {
  /** ON MATCH SET parameter */
  onMatchSet: string | OnMatchSetObjectI;
};

/**
 * Object form of ON MATCH SET.
 * Specifies the identifier and properties to set when a node is matched.
 */
export type OnMatchSetObjectI = {
  /** identifier whose properties will be set on match */
  identifier: string;
  /** properties to set when the node is matched */
  properties: Neo4jSupportedProperties;
};

/**
 * Dependencies required for generating the ON MATCH SET string.
 */
export interface GetOnMatchSetStringDeps {
  /** bind param instance to use for parameter binding */
  bindParam: BindParam;
}

/**
 * Type for the set parameter of getOnMatchSetString.
 */
export type GetOnMatchSetStringSet = OnMatchSetI['onMatchSet'];

/**
 * Type guard for checking if the onMatchSet parameter is a valid OnMatchSetObjectI.
 * Validates that it has a non-empty identifier string and valid properties object.
 * @param param - The parameter to check
 * @returns True if the parameter is a valid OnMatchSetObjectI
 */
export const isOnMatchSetObject = (
  param: OnMatchSetI['onMatchSet'],
): param is OnMatchSetObjectI => {
  if (typeof param === 'string') {
    return false;
  }
  const obj = param as OnMatchSetObjectI;
  return (
    typeof obj.identifier === 'string' &&
    obj.identifier.trim().length > 0 &&
    typeof obj.properties === 'object' &&
    obj.properties !== null
  );
};
