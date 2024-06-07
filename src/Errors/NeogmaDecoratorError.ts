import { NeogmaError } from './NeogmaError';

/** Decorator misuse error */
export class NeogmaDecoratorError extends NeogmaError {
  public message: NeogmaError['message'];
  public data: {
    description?: any;
    actual?: any;
    expected?: any;
  };

  constructor(
    message: NeogmaDecoratorError['message'],
    data?: NeogmaDecoratorError['data'],
  ) {
    super(message, data);
    this.message = message || 'neogma decorator error';
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaDecoratorError.prototype);
  }
}
