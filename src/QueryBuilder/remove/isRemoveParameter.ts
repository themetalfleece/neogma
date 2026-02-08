import type { ParameterI } from '../QueryBuilder.types';
import type {
  RemoveI,
  RemoveLabelsI,
  RemovePropertiesI,
} from './getRemoveString.types';

export const isRemoveParameter = (param: ParameterI): param is RemoveI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'remove')
  );
};

/**
 * Type guard for RemovePropertiesI. Returns false for invalid values (side-effect free).
 * Use assertRemoveProperties() if you need validation with error throwing.
 */
export const isRemoveProperties = (
  _param: RemoveI['remove'],
): _param is RemovePropertiesI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('properties' in _param) || !('identifier' in _param)) {
    return false;
  }
  const { identifier, properties } = _param as RemovePropertiesI;
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    return false;
  }
  if (typeof properties === 'string') {
    return properties.trim().length > 0;
  }
  if (Array.isArray(properties)) {
    return (
      properties.length > 0 &&
      properties.every((p) => typeof p === 'string' && p.trim().length > 0)
    );
  }
  return false;
};

/**
 * Type guard for RemoveLabelsI. Returns false for invalid values (side-effect free).
 * Use assertRemoveLabels() if you need validation with error throwing.
 */
export const isRemoveLabels = (
  _param: RemoveI['remove'],
): _param is RemoveLabelsI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('labels' in _param) || !('identifier' in _param)) {
    return false;
  }
  const { identifier, labels } = _param as RemoveLabelsI;
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    return false;
  }
  if (typeof labels === 'string') {
    return labels.trim().length > 0;
  }
  if (Array.isArray(labels)) {
    return (
      labels.length > 0 &&
      labels.every((l) => typeof l === 'string' && l.trim().length > 0)
    );
  }
  return false;
};
