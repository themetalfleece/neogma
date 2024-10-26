import { NodePropertyDecoratorOptions } from './shared/data-types';
import { addProperty } from './shared/property-service';
import { DataType } from './shared/data-types';

export function Property(arg: NodePropertyDecoratorOptions): Function {
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
  options: Partial<NodePropertyDecoratorOptions> = {},
): void {
  const parsedOptions: Partial<NodePropertyDecoratorOptions> = {
    ...options,
  };

  if (!parsedOptions?.schema) {
    parsedOptions.schema = {
      ...parsedOptions.schema,
      type: Reflect.getMetadata(
        'design:type',
        target,
        propertyName,
      ) as DataType,
    };
  }

  if (propertyDescriptor?.get) {
    parsedOptions.get = propertyDescriptor.get;
  }
  if (propertyDescriptor?.set) {
    parsedOptions.set = propertyDescriptor.set;
  }

  addProperty(target, propertyName, parsedOptions);
}
