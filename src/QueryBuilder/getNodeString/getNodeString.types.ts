import { BindParam } from '../../BindParam';
import { NodeForCreateI, NodeForMatchI } from '../QueryBuilder.types';

export type GetNodeStringNode = NodeForMatchI | NodeForCreateI;

export interface GetNodeStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
