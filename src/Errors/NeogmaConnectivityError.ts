import { NeogmaError } from './NeogmaError';

/** Error for when the connecting to neo4j is not possible */
export class NeogmaConnectivityError extends NeogmaError {
  constructor(data?: NeogmaConnectivityError['data']) {
    super('Error while connecting to neo4j', data);
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaConnectivityError.prototype);
  }
}
