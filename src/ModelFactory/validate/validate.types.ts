import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaModel } from '../model.types';
import type { PropertySchema } from '../shared.types';

export interface ValidateContext<Properties extends Neo4jSupportedProperties> {
  schema: {
    [index in keyof Properties]: PropertySchema<Properties>;
  };
  Model: NeogmaModel<Properties, any, any, any>;
}
