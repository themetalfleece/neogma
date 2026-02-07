/**
 * Represents a literal string value that should be inserted directly into a Cypher query
 * without parameterization.
 *
 * **SECURITY WARNING**: Literal values are inserted directly into Cypher queries without
 * any sanitization or escaping. Never pass user-provided input to a Literal, as this
 * can lead to Cypher injection attacks. Only use with trusted, hardcoded strings or
 * values that have been validated by your application using `isValidCypherIdentifier()`.
 *
 * Literals are useful for dynamic query parts that cannot be parameterized, such as:
 * - Cypher functions (e.g., `datetime()`, `timestamp()`)
 * - Dynamic expressions (e.g., `n.count + 1`)
 *
 * For property names, labels, and relationship types, prefer using the typed APIs
 * which provide runtime validation against injection attacks.
 *
 * @example
 * ```typescript
 * // SAFE: Using Cypher functions
 * const timestamp = new Literal('datetime()');
 * queryBuilder.set({ createdAt: timestamp });
 *
 * // SAFE: Using validated identifier
 * import { isValidCypherIdentifier } from 'neogma';
 * if (!isValidCypherIdentifier(userProperty)) {
 *   throw new Error('Invalid property name');
 * }
 * const prop = new Literal(userProperty);
 * ```
 *
 * @example
 * ```typescript
 * // UNSAFE: Never do this with user input!
 * // const userInput = req.body.property;
 * // const literal = new Literal(userInput); // VULNERABLE TO INJECTION
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
