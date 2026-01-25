import type { BindParam } from '../../BindParam';
import type { SetI } from '../QueryBuilder.types';

export type GetSetStringSet = SetI['set'];

export interface GetSetStringDeps {
  bindParam: BindParam;
}
