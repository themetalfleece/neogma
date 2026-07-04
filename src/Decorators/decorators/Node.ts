import {
  getClassMetadataStore,
  NEOGMA_NODE_KEY,
  NEOGMA_PROPERTIES_KEY,
  NEOGMA_RELATIONSHIPS_KEY,
  type NodeMetadata,
  type PropertyMetadata,
  type RelationshipMetadata,
} from '../metadata';
import type { NodeEntityClass } from '../types';

interface NodeOptions {
  /** The Neo4j label(s) for this node type */
  label: string | string[];
  /** Optional primary key field name */
  primaryKeyField?: string;
}

/**
 * Class decorator that marks a class as a Neogma node model.
 *
 * @param options - Node configuration
 *
 * @example
 * ```typescript
 * @Node({ label: 'User', primaryKeyField: 'id' })
 * class UserNode extends NodeEntity {
 *   // ...properties and relationships
 * }
 * ```
 */
export function Node(options: NodeOptions) {
  return function <T extends NodeEntityClass>(
    target: T,
    context: ClassDecoratorContext<T>,
  ): T {
    const metadata: NodeMetadata = {
      label: options.label,
      primaryKeyField: options.primaryKeyField,
    };
    // TC39 standard metadata path
    context.metadata[NEOGMA_NODE_KEY] = metadata;

    // Copy all accumulated metadata into the shared WeakMap store.
    // @Property and @Relationship field decorators ran before this class
    // decorator and wrote into context.metadata. We mirror everything into
    // the WeakMap so toModel() has a single lookup path that works for both
    // TC39 and legacy decorators.
    const store = getClassMetadataStore(target);
    store[NEOGMA_NODE_KEY] = metadata;
    const props = context.metadata[NEOGMA_PROPERTIES_KEY] as
      PropertyMetadata[] | undefined;
    if (props) {
      store[NEOGMA_PROPERTIES_KEY] = props;
    }
    const rels = context.metadata[NEOGMA_RELATIONSHIPS_KEY] as
      RelationshipMetadata[] | undefined;
    if (rels) {
      store[NEOGMA_RELATIONSHIPS_KEY] = rels;
    }
    return target;
  };
}
