import {
  getClassMetadataStore,
  NEOGMA_NODE_KEY,
  type NodeMetadata,
} from '../metadata';

interface NodeOptions {
  /** The Neo4j label(s) for this node type. If omitted, the class name is used. */
  label?: string | string[];
}

/**
 * Legacy class decorator that marks a class as a Neogma node model.
 * Use this when your project has `experimentalDecorators: true` (e.g. NestJS).
 *
 * @param options - Optional node configuration. When omitted or when `label`
 *   is not provided, the class name is used as the Neo4j label.
 *
 * @example
 * ```typescript
 * // Explicit label
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity { ... }
 *
 * // Label inferred from class name -> 'UserNode'
 * @Node()
 * class UserNode extends NodeEntity { ... }
 * ```
 */
export function Node(options?: NodeOptions) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
  ): T {
    const metadata: NodeMetadata = {
      label: options?.label ?? target.name,
    };
    getClassMetadataStore(target)[NEOGMA_NODE_KEY] = metadata;
    return target;
  };
}
