import { NeogmaConstraintError } from '../../Errors';
import { getNodeString } from '../getNodeString';
import { getRelationshipString } from '../getRelationshipString';
import {
  isCreateMultiple,
  isCreateRelated,
  isNodeWithLabel,
  isNodeWithModel,
  isRelationship,
} from '../QueryBuilder.types';
import {
  GetCreateOrMergeStringCreate,
  GetCreateOrMergeStringDeps,
  GetCreateOrMergeStringMode,
} from './getCreateOrMergeString.types';

export const getCreateOrMergeString = (
  create: GetCreateOrMergeStringCreate,
  mode: GetCreateOrMergeStringMode,
  deps: GetCreateOrMergeStringDeps,
): string => {
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
    // every even element is a node, every odd element is a relationship
    const parts: string[] = [];

    for (let index = 0; index < create.related.length; index++) {
      const element = create.related[index];
      if (index % 2) {
        // even, parse as relationship
        if (!isRelationship(element)) {
          throw new NeogmaConstraintError(
            'even argument of related is not a relationship',
          );
        }
        parts.push(getRelationshipString(element, deps).statement);
      } else {
        // odd, parse as node
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
