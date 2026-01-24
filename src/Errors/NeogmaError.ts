/**
 * The base error class for all Neogma errors.
 * All other Neogma error classes extend this.
 */
export class NeogmaError extends Error {
  public data: Record<string, unknown>;

  constructor(message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.data = data || {};
  }
}
