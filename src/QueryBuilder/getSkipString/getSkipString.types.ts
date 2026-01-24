import { BindParam } from '../../BindParam';
import { SkipI } from '../QueryBuilder.types';

export type GetSkipStringSkip = SkipI['skip'];

export interface GetSkipStringDeps {
  bindParam: BindParam;
}
