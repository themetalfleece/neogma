import { NeogmaError } from './NeogmaError';

/**
 * Error thrown when a requested resource (node, relationship, model) is not found.
 * Typically used in findOne operations when throwIfNotFound is true.
 */
export class NeogmaNotFoundError extends NeogmaError {
  public message: NeogmaError['message'];
  public data: Record<string, any>;

  constructor(
    message: NeogmaNotFoundError['message'],
    data?: NeogmaNotFoundError['data'],
  ) {
    super(message, data);
    this.message = message || 'Neogma not found error';
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaNotFoundError.prototype);
  }
}
