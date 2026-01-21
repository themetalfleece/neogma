import type { Runnable } from '../QueryRunner';

export type AnyObject = Record<string, any>;

export interface GenericConfiguration {
  session?: Runnable | null;
}

export type IValidationSchema<T = AnyObject> = Revalidator.ISchema<T> & {
  required: boolean;
};
