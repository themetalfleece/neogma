/**
 * Base class for decorator-based Neogma models.
 * Extend this class and use @Node, @Property, and @Relationship decorators.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @PrimaryKey()
 *   @Property(Type.String())
 *   id!: string;
 *
 *   @Property(Type.String({ minLength: 3 }))
 *   name!: string;
 * }
 * ```
 */
export abstract class NodeEntity {}
