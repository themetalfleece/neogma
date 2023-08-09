/* eslint-disable @typescript-eslint/ban-types */
import { setModelName, addOptions } from './shared/model-service';
import { ModelClassDecoratorOptions } from './shared/data-types';
import { Neo4jSupportedTypes } from 'Queries';

export function Model(options?: ModelClassDecoratorOptions): Function;
export function Model(target: Function): void;
export function Model(arg: any): void | Function {
  if (typeof arg === 'function') {
    annotate(arg);
  } else {
    const options: ModelClassDecoratorOptions = {
      ...arg,
    };
    return (target: any) => annotate(target, options);
  }
}

function annotate(target: any, options: ModelClassDecoratorOptions = {}): void {
  setModelName(target.prototype, options.label || target.name);
  addOptions(target.prototype, options);
}

export type Props<U extends object> = {
  [property in keyof U]: Neo4jSupportedTypes;
};
