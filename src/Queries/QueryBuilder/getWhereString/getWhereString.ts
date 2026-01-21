import { Where } from '../../Where';
import { GetWhereStringDeps, GetWhereStringWhere } from './getWhereString.types';

export const getWhereString = (
  where: GetWhereStringWhere,
  deps: GetWhereStringDeps,
): string => {
  if (typeof where === 'string') {
    return `WHERE ${where}`;
  }

  if (where instanceof Where) {
    const statement = where.getStatement('text');
    if (!statement) {
      return '';
    }
    return `WHERE ${statement}`;
  }

  // else, where object
  const whereInstance = new Where(where, deps.bindParam);
  const statement = whereInstance.getStatement('text');
  if (!statement) {
    return '';
  }
  return `WHERE ${statement}`;
};
