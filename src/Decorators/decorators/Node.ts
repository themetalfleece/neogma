import { NEOGMA_NODE_KEY, type NodeMetadata } from '../metadata';
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
    context.metadata[NEOGMA_NODE_KEY] = metadata;
    return target;
  };
}
