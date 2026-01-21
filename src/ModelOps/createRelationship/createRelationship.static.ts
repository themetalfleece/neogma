import { NeogmaError } from '../../Errors/NeogmaError';
import { QueryRunner } from '../../Queries/QueryRunner';
import type { CreateRelationshipParams } from './createRelationship.types';

/**
 * Creates a relationship using raw parameters.
 */
export async function createRelationship(
  queryRunner: QueryRunner,
  params: CreateRelationshipParams,
): Promise<number> {
  const res = await queryRunner.createRelationship(params);
  const relationshipsCreated =
    res.summary.counters.updates().relationshipsCreated;

  const { assertCreatedRelationships } = params;
  if (
    assertCreatedRelationships &&
    relationshipsCreated !== assertCreatedRelationships
  ) {
    throw new NeogmaError(`Not all required relationships were created`, {
      relationshipsCreated,
      ...params,
    });
  }

  return relationshipsCreated;
}
