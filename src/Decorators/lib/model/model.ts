/* eslint-disable @typescript-eslint/ban-types */
import { setModelName, addOptions } from './shared/model-service';
import { ModelClassDecoratorOptions } from '../../Decorators';

export function Model(options?: ModelClassDecoratorOptions): Function;
export function Model(target: Function): void;
export function Model(arg: any): void | Function {
  if (typeof arg === 'function') {
    annotate(arg);
  } else {
    const options: ModelClassDecoratorOptions = { ...arg };
    return (target: any) => annotate(target, options);
  }
}

function annotate(target: any, options: ModelClassDecoratorOptions = {}): void {
  setModelName(target.prototype, options.label || target.name);
  addOptions(target.prototype, options);
}
