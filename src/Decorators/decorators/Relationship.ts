import {
  registerRelationship,
  type RelationshipOptions,
  tc39Store,
} from '../core';

/**
 * Field decorator that declares a relationship on a node model.
 * The decorated field name becomes the relationship alias.
 *
 * Type the field as `Related<typeof OtherClass>` (no rel props) or
 * `Related<typeof OtherClass, typeof relProps>` (with rel props) so
 * `toModel()` can infer the related-nodes shape from the class.
 *
 * @example
 * ```typescript
 * import { Type, Related, NodeEntity, defineRelationshipProperties } from 'neogma';
 *
 * // Define properties once -- share between decorator and Related<>:
 * const orderRelProps = defineRelationshipProperties({
 *   Rating: { property: 'rating', schema: Type.Number({ minimum: 1, maximum: 5 }) },
 * });
 *
 * @Relationship({
 *   name: 'CREATES',
 *   direction: 'out',
 *   model: () => OrderNode,
 *   properties: orderRelProps,
 * })
 * Orders!: Related<typeof OrderNode, typeof orderRelProps>;
 * // CreateRelProps = { Rating: number }   -- auto-inferred
 * // RelProps       = { rating: number }   -- auto-inferred
 * ```
 *
 * @example
 * Co-locate properties as a static class member using the function form:
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   static readonly orderRelProps = defineRelationshipProperties({
 *     Rating: { property: 'rating', schema: Type.Number() },
 *   });
 *
 *   @Relationship({
 *     name: 'CREATES',
 *     direction: 'out',
 *     model: () => OrderNode,
 *     properties: () => UserNode.orderRelProps,
 *   })
 *   Orders!: Related<typeof OrderNode, typeof UserNode.orderRelProps>;
 * }
 * ```
 */
export function Relationship(options: RelationshipOptions) {
  return function (
    _value: undefined,
    context: ClassFieldDecoratorContext,
  ): void {
    registerRelationship(
      tc39Store(context.metadata),
      String(context.name),
      options,
    );
  };
}
