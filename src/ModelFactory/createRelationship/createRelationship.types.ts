import type { CreateRelationshipParamsI } from '../../QueryRunner';

export interface CreateRelationshipParams extends CreateRelationshipParamsI {
  assertCreatedRelationships?: number;
}
