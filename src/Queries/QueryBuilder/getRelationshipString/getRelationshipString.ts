import { Where } from '../../Where';
import { getRelationshipStatement } from '../getRelationshipStatement';
import { GetRelationshipStatementParams } from '../getRelationshipStatement/getRelationshipStatement.types';
import {
  isRelationshipWithProperties,
  isRelationshipWithWhere,
} from '../QueryBuilder.types';
import {
  GetRelationshipStringDeps,
  GetRelationshipStringRelationship,
} from './getRelationshipString.types';

export const getRelationshipString = (
  relationship: GetRelationshipStringRelationship,
  deps: GetRelationshipStringDeps,
): string => {
  if (typeof relationship === 'string') {
    return relationship;
  }

  // else, it's a relationship object
  const { direction, identifier, name, minHops, maxHops } = relationship;

  const getRelationshipStatementParams: GetRelationshipStatementParams = {
    direction,
    identifier: relationship.identifier,
    name,
    minHops,
    maxHops,
  };

  if (isRelationshipWithWhere(relationship)) {
    getRelationshipStatementParams.inner = new Where(
      {
        [identifier || '']: relationship.where,
      },
      deps.bindParam,
    );
  } else if (isRelationshipWithProperties(relationship)) {
    getRelationshipStatementParams.inner = {
      properties: relationship.properties,
      bindParam: deps.getBindParam(),
    };
  }

  return getRelationshipStatement(getRelationshipStatementParams);
};
