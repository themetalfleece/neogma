import type { BindParam } from '../../BindParam';
import type { MatchI } from '../QueryBuilder.types';

export type GetMatchStringMatch = MatchI['match'];

export interface GetMatchStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
