/* eslint-disable @typescript-eslint/ban-types */
import { ModelPropertyDecoratorOptions } from './shared/data-types';
import { addProperty } from './shared/property-service';
import { DataType } from './shared/data-types';

export function Property(arg: ModelPropertyDecoratorOptions): Function {
  return (
    target: any,
    propertyName: string,
    propertyDescriptor?: PropertyDescriptor,
  ) => {
    annotate(
      target,
      propertyName,
      propertyDescriptor ??
        Object.getOwnPropertyDescriptor(target, propertyName),
      arg,
    );
  };
}

function annotate(
  target: any,
  propertyName: string,
  propertyDescriptor?: PropertyDescriptor,
  optionsOrType: Partial<ModelPropertyDecoratorOptions> | DataType = {},
): void {
  const options: Partial<ModelPropertyDecoratorOptions> = {
    ...(optionsOrType as ModelPropertyDecoratorOptions),
  };

  if (!options?.schema) {
    options.schema = {
      ...options.schema,
      type: Reflect.getMetadata(
        'design:type',
        target,
        propertyName,
      ) as DataType,
    };
  }

  if (propertyDescriptor?.get) {
    options.get = propertyDescriptor.get;
  }
  if (propertyDescriptor?.set) {
    options.set = propertyDescriptor.set;
  }

  addProperty(target, propertyName, options);
}
