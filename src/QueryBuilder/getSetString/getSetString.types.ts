import { BindParam } from '../../BindParam';
import { SetI } from '../QueryBuilder.types';

export type GetSetStringSet = SetI['set'];

export interface GetSetStringDeps {
  bindParam: BindParam;
}
