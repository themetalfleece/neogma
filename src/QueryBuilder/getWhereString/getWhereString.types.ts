import type { BindParam } from '../../BindParam';
import type { WhereI } from '../QueryBuilder.types';

export type GetWhereStringWhere = WhereI['where'];

export interface GetWhereStringDeps {
  bindParam: BindParam;
}
