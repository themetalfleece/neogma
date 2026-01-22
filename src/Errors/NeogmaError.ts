/**
 * The base error class for all Neogma errors.
 * All other Neogma error classes extend this.
 */
export class NeogmaError extends Error {
  public message: string;
  public data: Record<string, any>;

  constructor(message: NeogmaError['message'], data?: NeogmaError['data']) {
    super(message);
    this.message = message || 'General Neogma error';
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaError.prototype);
  }
}
