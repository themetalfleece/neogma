import { NeogmaError } from './NeogmaError';

/** General constraint error */
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
        this.message = message || 'neogma constraint error';
        this.data = data || {};

        Object.setPrototypeOf(this, NeogmaConstraintError.prototype);
    }
}
