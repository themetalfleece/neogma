import type { BindParam } from '../../BindParam';
import type { Where, WhereParamsByIdentifierI } from '../../Where';

/** WHERE parameter */
export type WhereI = {
  /** WHERE parameter */
  where: string | Where | WhereParamsByIdentifierI;
};

export type GetWhereStringWhere = WhereI['where'];

export interface GetWhereStringDeps {
  bindParam: BindParam;
}
