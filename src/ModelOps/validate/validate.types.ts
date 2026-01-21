import type { Neo4jSupportedProperties } from '../../Queries';
import type { IValidationSchema } from '../shared.types';
import type { NeogmaModel } from '../model.types';

export interface ValidateContext<Properties extends Neo4jSupportedProperties> {
  schema: {
    [index in keyof Properties]:
      | IValidationSchema<Properties>
      | Revalidator.JSONSchema<Properties>;
  };
  Model: NeogmaModel<Properties, any, any, any>;
}
