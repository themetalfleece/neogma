import { QueryBuilder } from '../../QueryBuilder';
import type { LabelConfigContext } from './labelConfig.types';

/**
 * Gets the normalized label of the Model.
 */
export function getLabel(
  ctx: LabelConfigContext,
  operation?: Parameters<typeof QueryBuilder.getNormalizedLabels>[1],
): string {
  return QueryBuilder.getNormalizedLabels(ctx.modelLabel, operation);
}

/**
 * Gets a new array of the labels of the Model, as given in its definition.
 */
export function getRawLabels(ctx: LabelConfigContext): string[] {
  return Array.isArray(ctx.modelLabel) ? [...ctx.modelLabel] : [ctx.modelLabel];
}

/**
 * Gets the primary key field of the Model.
 */
export function getPrimaryKeyField(ctx: LabelConfigContext): string | null {
  return ctx.modelPrimaryKeyField || null;
}

/**
 * Gets the model name (used for queries).
 */
export function getModelName(ctx: LabelConfigContext): string {
  return ctx.modelName;
}
