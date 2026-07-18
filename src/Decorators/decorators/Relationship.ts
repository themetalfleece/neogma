import { NeogmaModelSchemaError } from '../../Errors';
import {
  getOrCreateMetadata,
  NEOGMA_RELATIONSHIPS_KEY,
  normalizeRelationshipProperties,
  type RelationshipMetadata,
  type RelationshipPropertyInput,
} from '../metadata';
import type { NodeEntityClass } from '../types';

interface RelationshipOptions {
  /** The Neo4j relationship type name (e.g., 'CREATES') */
  name: string;
  /** Direction of the relationship */
  direction: 'in' | 'out' | 'none';
  /**
   * Lazy reference to the target model class, or 'self' for self-referencing.
   * Use a function to avoid circular reference issues: `() => OrderNode`
   */
  model: (() => NodeEntityClass) | 'self';
  /**
   * Relationship property configurations. Accepts two forms:
   *
   * **Object syntax (preferred)** — keys are aliases:
   * ```typescript
   * properties: {
   *   Rating: { property: 'rating', schema: Type.Number() },
   *   // Shorthand when alias === property name:
   *   quantity: Type.Number(),
   * }
   * ```
   *
   * **Array syntax (legacy):**
   * ```typescript
   * properties: [{ alias: 'Rating', property: 'rating', schema: Type.Number() }]
   * ```
   */
  properties?: RelationshipPropertyInput;
}

/**
 * Field decorator that declares a relationship on a node model.
 * The decorated field name becomes the relationship alias.
 *
 * Type the field as `Related<typeof OtherClass, CreateRelProps?, RelProps?>`
 * so `toModel()` can infer the related-nodes shape from the class.
 *
 * @example
 * ```typescript
 * import { Type, Related, NodeEntity } from 'neogma';
 *
 * @Relationship({
 *   name: 'CREATES',
 *   direction: 'out',
 *   model: () => OrderNode,
 *   properties: {
 *     Rating: { property: 'rating', schema: Type.Number({ minimum: 1, maximum: 5 }) },
 *   },
 * })
 * Orders!: Related<typeof OrderNode, { Rating: number }, { rating: number }>;
 * ```
 */
export function Relationship(options: RelationshipOptions) {
  return function (
    _value: undefined,
    context: ClassFieldDecoratorContext,
  ): void {
    const alias = String(context.name);
    const relationships = getOrCreateMetadata<RelationshipMetadata[]>(
      context.metadata,
      NEOGMA_RELATIONSHIPS_KEY,
      [],
    );
    if (relationships.some((r) => r.alias === alias)) {
      throw new NeogmaModelSchemaError(
        `@Relationship decorator applied more than once to field "${alias}". ` +
          `Each field may only carry a single @Relationship decoration.`,
        { propertyKey: alias },
      );
    }
    relationships.push({
      alias,
      direction: options.direction,
      name: options.name,
      model: options.model,
      properties: normalizeRelationshipProperties(options.properties),
    });
  };
}
