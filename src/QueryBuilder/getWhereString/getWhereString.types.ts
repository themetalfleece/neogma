import { BindParam } from '../../BindParam';
import { WhereI } from '../QueryBuilder.types';

export type GetWhereStringWhere = WhereI['where'];

export interface GetWhereStringDeps {
  bindParam: BindParam;
}
