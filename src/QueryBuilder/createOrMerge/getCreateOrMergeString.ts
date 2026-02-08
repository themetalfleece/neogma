import { NeogmaConstraintError } from '../../Errors';
import { getNodeString } from '../nodeString';
import { getRelationshipString } from '../relationshipString';
import { isNodeWithLabel, isNodeWithModel, isRelationship } from '../shared';
import {
  assertCreateValue,
  assertMergeValue,
} from './assertCreateOrMergeValue';
import type {
  GetCreateOrMergeStringCreate,
  GetCreateOrMergeStringDeps,
  GetCreateOrMergeStringMode,
} from './getCreateOrMergeString.types';
import { isCreateMultiple, isCreateRelated } from './isCreateOrMergeParameter';

/**
 * Generates a CREATE or MERGE clause string.
 * Supports string literals, single nodes, multiple nodes, and related node patterns.
 */
export const getCreateOrMergeString = (
  create: GetCreateOrMergeStringCreate,
  mode: GetCreateOrMergeStringMode,
  deps: GetCreateOrMergeStringDeps,
): string => {
  if (mode === 'merge') {
    assertMergeValue(create);
  } else {
    assertCreateValue(create);
  }

  const createOrMerge = mode === 'merge' ? 'MERGE' : 'CREATE';

  if (typeof create === 'string') {
    return `${createOrMerge} ${create}`;
  }

  if (isCreateMultiple(create)) {
    return [
      createOrMerge,
      create.multiple
        .map((element) => getNodeString(element, deps).statement)
        .join(', '),
    ].join(' ');
  }

  if (isCreateRelated(create)) {
    // Pattern: node, relationship, node, ...
    // Even indices (0, 2, 4...) are nodes, odd indices (1, 3, 5...) are relationships
    const parts: string[] = [];

    for (let index = 0; index < create.related.length; index++) {
      const element = create.related[index];
      const isRelationshipIndex = index % 2 === 1;

      if (isRelationshipIndex) {
        if (!isRelationship(element)) {
          throw new NeogmaConstraintError(
            `Expected relationship at index ${index}, got node`,
          );
        }
        parts.push(getRelationshipString(element, deps).statement);
      } else {
        parts.push(getNodeString(element, deps).statement);
      }
    }

    return [createOrMerge, parts.join('')].join(' ');
  }

  // else, is a node
  if (isNodeWithLabel(create)) {
    return [
      createOrMerge,
      getNodeString(
        {
          identifier: create.identifier,
          label: create.label,
          properties: create.properties,
        },
        deps,
      ).statement,
    ].join(' ');
  }
  if (isNodeWithModel(create)) {
    return [
      createOrMerge,
      getNodeString(
        {
          identifier: create.identifier,
          model: create.model,
          properties: create.properties,
        },
        deps,
      ).statement,
    ].join(' ');
  }

  throw new NeogmaConstraintError('Invalid create parameter', {
    actual: create,
  });
};
