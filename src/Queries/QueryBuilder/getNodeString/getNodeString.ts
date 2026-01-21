import { Where } from '../../Where';
import { getNodeStatement } from '../getNodeStatement';
import { GetNodeStatementParams } from '../getNodeStatement/getNodeStatement.types';
import {
  isNodeWithLabel,
  isNodeWithModel,
  isNodeWithProperties,
  isNodeWithWhere,
} from '../QueryBuilder.types';
import { GetNodeStringDeps, GetNodeStringNode } from './getNodeString.types';

export const getNodeString = (
  node: GetNodeStringNode,
  deps: GetNodeStringDeps,
): string => {
  if (typeof node === 'string') {
    return node;
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

  if (isNodeWithWhere(node)) {
    getNodeStatementParams.inner = new Where(
      {
        [node.identifier || '']: node.where,
      },
      deps.bindParam,
    );
  } else if (isNodeWithProperties(node)) {
    getNodeStatementParams.inner = {
      properties: node.properties,
      bindParam: deps.getBindParam(),
    };
  }

  // (identifier: label { where })
  return getNodeStatement(getNodeStatementParams);
};
