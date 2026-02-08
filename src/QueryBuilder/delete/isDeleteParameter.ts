import type {
  DeleteByIdentifierI,
  DeleteI,
  DeleteLiteralI,
} from './getDeleteString.types';

/**
 * Type guard for DeleteI. Checks if param has a 'delete' key.
 * Value validation happens in getDeleteString via assertDeleteValue.
 */
export const isDeleteParameter = (param: unknown): param is DeleteI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'delete')
  );
};

/**
 * Type guard for DeleteByIdentifierI. Returns false for invalid values (side-effect free).
 * Use assertDeleteWithIdentifier() if you need validation with error throwing.
 */
export const isDeleteWithIdentifier = (
  _param: DeleteI['delete'],
): _param is DeleteByIdentifierI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('identifiers' in _param)) {
    return false;
  }
  const identifiers = (_param as DeleteByIdentifierI).identifiers;
  if (typeof identifiers === 'string') {
    return identifiers.trim().length > 0;
  }
  if (Array.isArray(identifiers)) {
    return (
      identifiers.length > 0 &&
      identifiers.every((id) => typeof id === 'string' && id.trim().length > 0)
    );
  }
  return false;
};

/**
 * Type guard for DeleteLiteralI. Returns false for invalid values (side-effect free).
 * Use assertDeleteWithLiteral() if you need validation with error throwing.
 */
export const isDeleteWithLiteral = (
  _param: DeleteI['delete'],
): _param is DeleteLiteralI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('literal' in _param)) {
    return false;
  }
  const literal = (_param as DeleteLiteralI).literal;
  return typeof literal === 'string' && literal.trim().length > 0;
};
