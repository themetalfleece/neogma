import type {
  MatchI,
  MatchLiteralI,
  MatchMultipleI,
  MatchRelatedI,
} from './getMatchString.types';

/**
 * Type guard for MatchI parameter.
 * Checks if the parameter has a 'match' key.
 */
export const isMatchParameter = (param: unknown): param is MatchI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'match')
  );
};

/**
 * Type guard for MatchRelatedI. Returns false for invalid values (side-effect free).
 * Use assertMatchRelated() if you need validation with error throwing.
 */
export const isMatchRelated = (
  param: MatchI['match'],
): param is MatchRelatedI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('related' in param)) {
    return false;
  }
  return Array.isArray((param as MatchRelatedI).related);
};

/**
 * Type guard for MatchMultipleI. Returns false for invalid values (side-effect free).
 * Use assertMatchMultiple() if you need validation with error throwing.
 */
export const isMatchMultiple = (
  param: MatchI['match'],
): param is MatchMultipleI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('multiple' in param)) {
    return false;
  }
  return Array.isArray((param as MatchMultipleI).multiple);
};

/**
 * Type guard for MatchLiteralI. Returns false for invalid values (side-effect free).
 * Use assertMatchLiteral() if you need validation with error throwing.
 */
export const isMatchLiteral = (
  param: MatchI['match'],
): param is MatchLiteralI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('literal' in param)) {
    return false;
  }
  const literal = (param as MatchLiteralI).literal;
  return typeof literal === 'string' && literal.trim().length > 0;
};
