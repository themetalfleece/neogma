/** The base error which is thrown in neogma. All other errors entend this. */
export class NeogmaError extends Error {
    public message: string;
    public data: Record<string, any>;

    constructor(message: NeogmaError['message'], data?: NeogmaError['data']) {
        super(message);
        this.message = message || 'General neogma error';
        this.data = data || {};

        Object.setPrototypeOf(this, NeogmaError.prototype);
    }
}
