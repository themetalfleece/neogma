import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaModel } from '../model.types';
import type { IValidationSchema } from '../shared.types';

export interface ValidateContext<Properties extends Neo4jSupportedProperties> {
  schema: {
    [index in keyof Properties]:
      | IValidationSchema<Properties>
      | Revalidator.JSONSchema<Properties>;
  };
  Model: NeogmaModel<Properties, any, any, any>;
}
