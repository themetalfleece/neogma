/**
 * Represents a literal string value that should be inserted directly into a Cypher query
 * without parameterization. Use with caution to avoid Cypher injection vulnerabilities.
 *
 * Literals are useful for dynamic query parts that cannot be parameterized, such as:
 * - Property names
 * - Labels
 * - Relationship types
 * - Cypher keywords and functions
 *
 * @example
 * ```typescript
 * const propName = new Literal('name');
 * // Will be inserted as: SET n.name = $value
 * // Rather than: SET n.$propName = $value
 * ```
 */
export class Literal {
  /**
   * Creates a new Literal instance.
   *
   * @param value - The string value to be used as a literal in the query
   */
  constructor(private value: string) {}

  /**
   * Returns the literal string value.
   *
   * @returns The raw string value
   */
  public getValue(): string {
    return this.value;
  }
}
