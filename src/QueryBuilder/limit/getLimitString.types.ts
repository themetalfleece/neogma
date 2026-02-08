import type { BindParam } from '../../BindParam';

/** LIMIT parameter */
export type LimitI = { limit: string | number };

export type GetLimitStringLimit = LimitI['limit'];

export interface GetLimitStringDeps {
  bindParam: BindParam;
}
