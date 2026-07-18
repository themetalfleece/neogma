import {
  registerRelationship,
  type RelationshipOptions,
  weakMapStore,
} from '../core';
import { getClassMetadataStore } from '../metadata';

/**
 * Legacy field decorator that declares a relationship on a node model.
 * Use this when your project has `experimentalDecorators: true` (e.g. NestJS).
 *
 * @example
 * ```typescript
 * @Relationship({
 *   name: 'CREATES',
 *   direction: 'out',
 *   model: () => OrderNode,
 *   properties: {
 *     Rating: { property: 'rating', schema: Type.Number() },
 *   },
 * })
 * Orders!: Related<typeof OrderNode>;
 * ```
 */
export function Relationship(options: RelationshipOptions) {
  return function (target: object, propertyKey: string): void {
    registerRelationship(
      weakMapStore(getClassMetadataStore(target.constructor)),
      propertyKey,
      options,
    );
  };
}
