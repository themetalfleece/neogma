import { NeogmaError } from './NeogmaError';

/**
 * Error thrown when a constraint or validation rule is violated.
 * Use this for structural issues like missing required fields, invalid parameters, or type mismatches.
 */
export class NeogmaConstraintError extends NeogmaError {
  public message: NeogmaError['message'];
  public data: {
    description?: any;
    actual?: any;
    expected?: any;
  };

  constructor(
    message: NeogmaConstraintError['message'],
    data?: NeogmaConstraintError['data'],
  ) {
    super(message, data);
    this.message = message || 'Neogma constraint error';
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaConstraintError.prototype);
  }
}
