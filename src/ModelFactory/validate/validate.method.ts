import revalidator from 'revalidator';

import { checkSchema, isTSchema } from '../../Decorators/validatorAdapter';
import { NeogmaInstanceValidationError } from '../../Errors/NeogmaInstanceValidationError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { ValidateContext } from './validate.types';

/**
 * Validates the given instance against its schema.
 *
 * Each schema entry is routed to its native validator:
 * - TypeBox `TSchema` entries → `Value.Check` / `Value.Errors` (primary path)
 * - Revalidator-shaped entries → `revalidator.validate` (legacy fallback)
 *
 * @throws NeogmaInstanceValidationError
 */
export async function validate<Properties extends Neo4jSupportedProperties>(
  dataValues: Properties,
  ctx: ValidateContext<Properties>,
): Promise<void> {
  const errors: Revalidator.IErrrorProperty[] = [];
  const legacyEntries: Record<string, unknown> = {};

  for (const key of Object.keys(ctx.schema)) {
    const entry = (ctx.schema as Record<string, unknown>)[key];
    if (isTSchema(entry)) {
      errors.push(
        ...checkSchema(
          key,
          entry,
          (dataValues as Record<string, unknown>)[key],
        ),
      );
    } else if (entry != null) {
      legacyEntries[key] = entry;
    }
  }

  if (Object.keys(legacyEntries).length > 0) {
    const validationResult = revalidator.validate(dataValues, {
      type: 'object',
      properties: legacyEntries as Revalidator.ISchemas<Properties>,
    });
    errors.push(...validationResult.errors);
  }

  if (errors.length) {
    throw new NeogmaInstanceValidationError(
      'Error while validating an instance',
      {
        model: ctx.Model,
        errors,
      },
    );
  }
}
