import {
  getClassMetadataStore,
  NEOGMA_NODE_KEY,
  type NodeMetadata,
} from '../metadata';

interface NodeOptions {
  /** The Neo4j label(s) for this node type */
  label: string | string[];
  /** Optional primary key field name */
  primaryKeyField?: string;
}

/**
 * Legacy class decorator that marks a class as a Neogma node model.
 * Use this when your project has `experimentalDecorators: true` (e.g. NestJS).
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
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
  ): T {
    const metadata: NodeMetadata = {
      label: options.label,
      primaryKeyField: options.primaryKeyField,
    };
    getClassMetadataStore(target)[NEOGMA_NODE_KEY] = metadata;
    return target;
  };
}
