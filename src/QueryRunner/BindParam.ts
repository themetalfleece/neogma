import * as clone from 'clone';
import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import { StringSequence } from '../utils/StringSequence';

/**
 * the bind param which should be passed to a query. It throws an error if more than one of each key is added
 */
export class BindParam {
    /** acquires a BindParam, so it ensures that a BindParam is always returned. If it's passed, it will be returned as is. Else, a new one will be created and returned */
    public static acquire(bindParam: BindParam | null) {
        if (bindParam) { return bindParam; }
        return new BindParam();
    }

    /** the object with the bind param */
    private bind: Record<string, any>;

    constructor(...objects: Array<BindParam['bind']>) {
        this.bind = {};
        this.add(...objects);
    }

    /**
     * adds objects to the bind attribute, throwing an error if a given key already exists in the bind param
     */
    public add(...objects: Array<BindParam['bind']>) {
        for (const object of objects) {
            for (const key in object) {
                if (!object.hasOwnProperty(key)) { continue; }
                if (this.bind.hasOwnProperty(key)) {
                    throw new NeogmaConstraintError(`key ${key} already in the bind param`);
                }
                this.bind[key] = object[key];
            }
        }

        return this;
    }

    /**
     * returns a new BindParam instance with a clone of the bind property
     */
    public clone() {
        return new BindParam(clone(this.get()));
    }

    /**
     * returns the bind attribute
     */
    public get() {
        return this.bind;
    }

    /** returns a name which isn't a key of bind, and starts with the suffix */
    public getUniqueName(suffix: string): string {
        if (!this.bind.hasOwnProperty(suffix)) {
            return suffix;
        } else {
            const stringSequence = new StringSequence('a', 'zzzz', 4);
            while (true) {
                const newKey = suffix + '__' + stringSequence.getNextString(true);
                if (!this.bind.hasOwnProperty(newKey)) {
                    return newKey;
                }
            }
        }
    }

    /** returns a name which isn't a key of bind and adds the value to the bind param with the created name */
    public getUniqueNameAndAdd(
        suffix: Parameters<typeof BindParam['prototype']['getUniqueName']>[0],
        value: Parameters<typeof BindParam['prototype']['add']>[0][0]
    ): string {
        const name = this.getUniqueName(suffix);
        this.add({
            [name]: value,
        });
        return name;
    }
}
