import { setNodeName, addOptions } from './shared/node-service';
import { NodeClassDecoratorOptions } from './shared/data-types';

export function Node(options?: NodeClassDecoratorOptions): Function;
export function Node(target: Function): void;
export function Node(arg: unknown): void | Function {
  if (typeof arg === 'function') {
    annotate(arg);
  } else {
    const options: NodeClassDecoratorOptions = {
      ...(arg as object),
    };
    return (target: Function | Object) => annotate(target, options);
  }
}

function annotate(
  target: Function | Object,
  options: NodeClassDecoratorOptions = {},
): void {
  setNodeName(target['prototype'], options.label || target['name']);
  addOptions(target['prototype'], options);
}

export type Props<U> = {
  [property in keyof U]: U[property];
};
