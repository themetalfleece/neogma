import type { BindParam } from '../../BindParam';
import type { LimitI } from '../QueryBuilder.types';

export type GetLimitStringLimit = LimitI['limit'];

export interface GetLimitStringDeps {
  bindParam: BindParam;
}
