import { BindParam } from '../../BindParam';
import {
  RelationshipForCreateI,
  RelationshipForMatchI,
} from '../QueryBuilder.types';

export type GetRelationshipStringRelationship =
  | RelationshipForMatchI
  | RelationshipForCreateI;

export interface GetRelationshipStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
