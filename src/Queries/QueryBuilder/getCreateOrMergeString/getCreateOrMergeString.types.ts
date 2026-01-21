import { BindParam } from '../../BindParam';
import { CreateI } from '../QueryBuilder.types';

export type GetCreateOrMergeStringCreate = CreateI['create'];
export type GetCreateOrMergeStringMode = 'create' | 'merge';

export interface GetCreateOrMergeStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
