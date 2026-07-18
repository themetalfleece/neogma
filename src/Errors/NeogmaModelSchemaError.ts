import { NeogmaError } from './NeogmaError';

export interface NeogmaModelSchemaErrorData extends Record<string, unknown> {
  /** Name of the class or model whose schema/decorator wiring is wrong. */
  className?: string;
  /** Property or relationship alias that triggered the error, if applicable. */
  propertyKey?: string;
}

/**
 * Error thrown when a decorated class or its metadata are wired up in a way
 * that prevents `toModel()` from producing a valid NeogmaModel — e.g. a class
 * missing `@Node`, a `@Relationship` target that cannot be resolved from the
 * model registry, or a lazy `model: () => OtherNode` reference that throws.
 *
 * Raised at model-build time, never during a query.
 */
export class NeogmaModelSchemaError extends NeogmaError {
  public override data: NeogmaModelSchemaErrorData;

  constructor(message: string, data: NeogmaModelSchemaErrorData = {}) {
    super(message, data);
    this.data = data;
  }
}
