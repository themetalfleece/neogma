import { NeogmaModelSchemaError } from '../../Errors';
import {
  getClassMetadataStore,
  NEOGMA_RELATIONSHIPS_KEY,
  type RelationshipMetadata,
  type RelationshipPropertyEntry,
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
  /** Relationship property configurations */
  properties?: RelationshipPropertyEntry[];
}

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
 * })
 * Orders!: Related<typeof OrderNode>;
 * ```
 */
export function Relationship(options: RelationshipOptions) {
  return function (target: object, propertyKey: string): void {
    const alias = propertyKey;
    const store = getClassMetadataStore(target.constructor);
    if (!store[NEOGMA_RELATIONSHIPS_KEY]) {
      store[NEOGMA_RELATIONSHIPS_KEY] = [];
    }
    const relationships = store[NEOGMA_RELATIONSHIPS_KEY]!;
    if (relationships.some((r: RelationshipMetadata) => r.alias === alias)) {
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
      properties: options.properties,
    });
  };
}
