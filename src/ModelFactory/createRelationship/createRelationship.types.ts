import type { CreateRelationshipParamsI } from '../../Queries/QueryRunner';

export interface CreateRelationshipParams extends CreateRelationshipParamsI {
  assertCreatedRelationships?: number;
}
