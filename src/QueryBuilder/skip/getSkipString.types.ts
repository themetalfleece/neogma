import type { BindParam } from '../../BindParam';

/** SKIP parameter */
export type SkipI = { skip: string | number };

export type GetSkipStringSkip = SkipI['skip'];

export interface GetSkipStringDeps {
  bindParam: BindParam;
}
