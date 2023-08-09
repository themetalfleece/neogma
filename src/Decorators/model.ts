import { setModelName, addOptions } from './shared/model-service';
import { ModelClassDecoratorOptions } from './shared/data-types';
import { Neo4jSupportedTypes } from 'Queries';

export function Model(options?: ModelClassDecoratorOptions): Function;
export function Model(target: Function): void;
export function Model(arg: unknown): void | Function {
  if (typeof arg === 'function') {
    annotate(arg);
  } else {
    const options: ModelClassDecoratorOptions = {
      ...(arg as object),
    };
    return (target: Function | Object) => annotate(target, options);
  }
}

function annotate(
  target: Function | Object,
  options: ModelClassDecoratorOptions = {},
): void {
  setModelName(target['prototype'], options.label || target['name']);
  addOptions(target['prototype'], options);
}

export type Props<U extends object> = {
  [property in keyof U]: Neo4jSupportedTypes;
};
