/** ORDER BY object with identifier, property, and direction */
export type OrderByObjectI = {
  /** identifier to order */
  identifier: string;
  /** only order this property of the identifier */
  property?: string;
  /** direction of this order */
  direction?: 'ASC' | 'DESC';
};

/** ORDER BY parameter */
export type OrderByI = {
  orderBy:
    | string
    | Array<string | [string, 'ASC' | 'DESC'] | OrderByObjectI>
    | OrderByObjectI;
};

export type GetOrderByStringOrderBy = OrderByI['orderBy'];

/**
 * Type guard for checking if the orderBy parameter is a valid OrderByObjectI.
 * Validates that it has a non-empty 'identifier' string.
 * @param param - The parameter to check
 * @returns True if the parameter is a valid OrderByObjectI (not a string or array)
 */
export const isOrderByObject = (
  param: OrderByI['orderBy'],
): param is OrderByObjectI => {
  if (typeof param === 'string' || Array.isArray(param)) {
    return false;
  }
  const obj = param as OrderByObjectI;
  return typeof obj.identifier === 'string' && obj.identifier.trim().length > 0;
};
