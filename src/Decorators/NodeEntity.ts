/**
 * Base class for decorator-based Neogma models.
 * Extend this class and use @Node, @Property, and @Relationship decorators.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User', primaryKeyField: 'id' })
 * class UserNode extends NodeEntity {
 *   @Property(z.string())
 *   id!: string;
 *
 *   @Property(z.string().min(3))
 *   name!: string;
 * }
 * ```
 */
export abstract class NodeEntity {}
