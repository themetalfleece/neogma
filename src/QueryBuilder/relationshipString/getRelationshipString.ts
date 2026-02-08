import { Where } from '../../Where';
import {
  assertRelationshipWithProperties,
  assertRelationshipWithWhere,
  isRelationshipWithProperties,
  isRelationshipWithWhere,
} from '../QueryBuilder.types';
import { getRelationshipStatement } from '../relationshipStatement';
import type { GetRelationshipStatementParams } from '../relationshipStatement/getRelationshipStatement.types';
import type {
  GetRelationshipStringDeps,
  GetRelationshipStringRelationship,
  GetRelationshipStringResult,
} from './getRelationshipString.types';

/**
 * Generates a relationship pattern string for use in Cypher queries.
 * Handles string literals, relationship objects with properties, and where conditions.
 */
export const getRelationshipString = (
  relationship: GetRelationshipStringRelationship,
  deps: GetRelationshipStringDeps,
): GetRelationshipStringResult => {
  if (typeof relationship === 'string') {
    return { statement: relationship, standaloneWhere: null };
  }

  // Validate before checking type - throws with specific error message if invalid
  assertRelationshipWithWhere(relationship);
  assertRelationshipWithProperties(relationship);

  // else, it's a relationship object
  const { direction, identifier, name, minHops, maxHops } = relationship;

  const getRelationshipStatementParams: GetRelationshipStatementParams = {
    direction,
    identifier: relationship.identifier,
    name,
    minHops,
    maxHops,
  };

  let standaloneWhere: Where | null = null;

  if (isRelationshipWithWhere(relationship)) {
    // Split where params into eq-only (for bracket syntax) and non-eq (for WHERE clause)
    const { eqParams, nonEqParams } = Where.splitByOperator(relationship.where);

    const hasNonEqParams = Object.keys(nonEqParams).length > 0;

    // Generate a unique identifier if needed for non-eq operators
    let relationshipIdentifier = identifier || '';
    if (!relationshipIdentifier && hasNonEqParams) {
      relationshipIdentifier = deps.bindParam.getUniqueName('__r');
      getRelationshipStatementParams.identifier = relationshipIdentifier;
    }

    // Use eq params for bracket syntax inside the relationship pattern
    if (Object.keys(eqParams).length > 0) {
      getRelationshipStatementParams.inner = new Where(
        { [relationshipIdentifier]: eqParams },
        deps.bindParam,
      );
    }

    // Create separate Where for non-eq params to be used in WHERE clause
    if (hasNonEqParams) {
      standaloneWhere = new Where(
        { [relationshipIdentifier]: nonEqParams },
        deps.bindParam,
      );
    }
  } else if (isRelationshipWithProperties(relationship)) {
    getRelationshipStatementParams.inner = {
      properties: relationship.properties,
      bindParam: deps.getBindParam(),
    };
  }

  return {
    statement: getRelationshipStatement(getRelationshipStatementParams),
    standaloneWhere,
  };
};
