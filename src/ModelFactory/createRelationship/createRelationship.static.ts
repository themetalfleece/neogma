import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import type { QueryRunner } from '../../QueryRunner';
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
    throw new NeogmaConstraintError(
      'Not all required relationships were created',
      {
        actual: { relationshipsCreated },
        expected: { assertCreatedRelationships },
      },
    );
  }

  return relationshipsCreated;
}
