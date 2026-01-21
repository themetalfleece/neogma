import revalidator from 'revalidator';

import { NeogmaInstanceValidationError } from '../../Errors/NeogmaInstanceValidationError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { ValidateContext } from './validate.types';

/**
 * Validates the given instance against the schema.
 * @throws NeogmaInstanceValidationError
 */
export async function validate<Properties extends Neo4jSupportedProperties>(
  dataValues: Properties,
  ctx: ValidateContext<Properties>,
): Promise<void> {
  const validationResult = revalidator.validate(dataValues, {
    type: 'object',
    properties: ctx.schema,
  });

  if (validationResult.errors.length) {
    throw new NeogmaInstanceValidationError(
      'Error while validating an instance',
      {
        model: ctx.Model,
        errors: validationResult.errors,
      },
    );
  }
}
