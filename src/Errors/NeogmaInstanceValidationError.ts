import { NeogmaModel } from '../ModelFactory';
import { NeogmaError } from './NeogmaError';

export interface NeogmaInstanceValidationErrorData
  extends Record<string, unknown> {
  model: NeogmaModel<any, any, any, any>;
  errors: Revalidator.IErrrorProperty[];
}

/**
 * Error thrown when instance validation fails.
 * Contains the model and validation errors.
 */
export class NeogmaInstanceValidationError extends NeogmaError {
  public override data: NeogmaInstanceValidationErrorData;

  constructor(message: string, data: NeogmaInstanceValidationErrorData) {
    super(message, data);
    this.data = data;
  }
}
