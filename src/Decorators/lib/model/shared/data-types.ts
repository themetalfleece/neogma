import { Neo4jSupportedProperties } from '../../../../Queries';

export type PropertySchema =
  | Revalidator.ISchema<Neo4jSupportedProperties>
  | Revalidator.JSONSchema<Neo4jSupportedProperties>;

export type DataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'object'
  | 'null'
  | 'any';
