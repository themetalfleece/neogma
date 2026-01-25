import { Where } from '../../Where';
import { getNodeStatement } from '../getNodeStatement';
import { GetNodeStatementParams } from '../getNodeStatement/getNodeStatement.types';
import {
  isNodeWithLabel,
  isNodeWithModel,
  isNodeWithProperties,
  isNodeWithWhere,
} from '../QueryBuilder.types';
import {
  GetNodeStringDeps,
  GetNodeStringNode,
  GetNodeStringResult,
} from './getNodeString.types';

export const getNodeString = (
  node: GetNodeStringNode,
  deps: GetNodeStringDeps,
): GetNodeStringResult => {
  if (typeof node === 'string') {
    return { statement: node, standaloneWhere: null };
  }

  // else, it's a NodeObjectI
  let label = '';
  if (isNodeWithLabel(node)) {
    label = node.label;
  } else if (isNodeWithModel(node)) {
    label = node.model.getLabel();
  }

  const getNodeStatementParams: GetNodeStatementParams = {
    identifier: node.identifier,
    label,
  };

  let standaloneWhere: Where | null = null;

  if (isNodeWithWhere(node)) {
    // Split where params into eq-only (for bracket syntax) and non-eq (for WHERE clause)
    const { eqParams, nonEqParams } = Where.splitByOperator(node.where);

    const hasNonEqParams = Object.keys(nonEqParams).length > 0;

    // Generate a unique identifier if needed for non-eq operators
    let nodeIdentifier = node.identifier || '';
    if (!nodeIdentifier && hasNonEqParams) {
      nodeIdentifier = deps.bindParam.getUniqueName('__n');
      getNodeStatementParams.identifier = nodeIdentifier;
    }

    // Use eq params for bracket syntax inside the node pattern
    if (Object.keys(eqParams).length > 0) {
      getNodeStatementParams.inner = new Where(
        { [nodeIdentifier]: eqParams },
        deps.bindParam,
      );
    }

    // Create separate Where for non-eq params to be used in WHERE clause
    if (hasNonEqParams) {
      standaloneWhere = new Where(
        { [nodeIdentifier]: nonEqParams },
        deps.bindParam,
      );
    }
  } else if (isNodeWithProperties(node)) {
    getNodeStatementParams.inner = {
      properties: node.properties,
      bindParam: deps.getBindParam(),
    };
  }

  // (identifier: label { where })
  return {
    statement: getNodeStatement(getNodeStatementParams),
    standaloneWhere,
  };
};
