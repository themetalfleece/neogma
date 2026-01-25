import type { BindParam } from '../../BindParam';
import type { SkipI } from '../QueryBuilder.types';

export type GetSkipStringSkip = SkipI['skip'];

export interface GetSkipStringDeps {
  bindParam: BindParam;
}
