import { NeogmaModel } from '../ModelOps';

export class ModelNotInitializedError extends Error {
  message: string;

  constructor(
    modelClass: NeogmaModel<any, any, Object, Object>,
    additionalMessage: string,
  ) {
    super();
    this.message =
      `Model not initialized: ${additionalMessage} "${modelClass.getLabel()}" ` +
      `needs to be added to a Neogma instance.`;
  }
}
