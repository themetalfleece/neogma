import type { ParameterI } from '../QueryBuilder.types';
import type {
  CreateI,
  CreateMultipleI,
  CreateRelatedI,
  MergeI,
} from './getCreateOrMergeString.types';

export const isCreateParameter = (param: ParameterI): param is CreateI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'create')
  );
};

export const isMergeParameter = (param: ParameterI): param is MergeI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'merge')
  );
};

/**
 * Type guard for CreateRelatedI. Returns false for invalid values (side-effect free).
 * Use assertCreateRelated() if you need validation with error throwing.
 */
export const isCreateRelated = (
  param: CreateI['create'],
): param is CreateRelatedI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('related' in param)) {
    return false;
  }
  return Array.isArray((param as CreateRelatedI).related);
};

/**
 * Type guard for CreateMultipleI. Returns false for invalid values (side-effect free).
 * Use assertCreateMultiple() if you need validation with error throwing.
 */
export const isCreateMultiple = (
  param: CreateI['create'],
): param is CreateMultipleI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('multiple' in param)) {
    return false;
  }
  return Array.isArray((param as CreateMultipleI).multiple);
};
