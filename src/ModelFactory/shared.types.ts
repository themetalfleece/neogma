import type { Runnable } from '../Queries/QueryRunner';

export type AnyObject = Record<string, any>;

export interface GenericConfiguration {
  session?: Runnable | null;
}

export type IValidationSchema<T = AnyObject> = Revalidator.ISchema<T> & {
  required: boolean;
};
