import { NeogmaError } from './NeogmaError';

export interface NeogmaConstraintErrorData extends Record<string, unknown> {
  description?: unknown;
  actual?: unknown;
  expected?: unknown;
}

/**
 * Error thrown when a constraint or validation rule is violated.
 * Use this for structural issues like missing required fields, invalid parameters, or type mismatches.
 */
export class NeogmaConstraintError extends NeogmaError {
  public override data: NeogmaConstraintErrorData;

  constructor(message: string, data?: NeogmaConstraintErrorData) {
    super(message, data);
    this.data = data || {};
  }
}
