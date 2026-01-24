import { BindParam } from '../../BindParam';
import { LimitI } from '../QueryBuilder.types';

export type GetLimitStringLimit = LimitI['limit'];

export interface GetLimitStringDeps {
  bindParam: BindParam;
}
