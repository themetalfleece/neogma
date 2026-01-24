import { BindParam } from '../../BindParam';
import { MatchI } from '../QueryBuilder.types';

export type GetMatchStringMatch = MatchI['match'];

export interface GetMatchStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
