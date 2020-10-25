import { NeogmaModel } from '../ModelOps';
import { NeogmaError } from './NeogmaError';

/** Error from validating an instance */
export class NeogmaInstanceValidationError extends NeogmaError {
    public message: NeogmaError['message'];
    public data: {
        model: NeogmaModel<any, any, any, any>;
        errors: Revalidator.IErrrorProperty[];
    };

    constructor(
        message: NeogmaInstanceValidationError['message'],
        data: NeogmaInstanceValidationError['data'],
    ) {
        super(message, data);
        this.message = message || 'neogma validation error';
        this.data = data;

        Object.setPrototypeOf(this, NeogmaInstanceValidationError.prototype);
    }
}
