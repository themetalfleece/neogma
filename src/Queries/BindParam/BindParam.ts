import clone from 'clone';
import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { StringSequence } from '../../utils/StringSequence';
import { NeogmaError } from '../../Errors';

/**
 * the bind param which should be passed to a query. It throws an error if more than one of each key is added
 */
export class BindParam {
    /** acquires a BindParam, so it ensures that a BindParam is always returned. If it's passed, it will be returned as is. Else, a new one will be created and returned */
    public static acquire(bindParam?: BindParam | null): BindParam {
        return bindParam || new BindParam();
    }

    /** the object with the bind param */
    private bind: Record<string, any> = {};

    constructor(...objects: Array<BindParam['bind']>) {
        this.add(...objects);
    }

    /**
     * adds objects to the bind attribute, throwing an error if a given key already exists in the bind param
     */
    public add(...objects: Array<BindParam['bind']>): BindParam {
        for (const object of objects) {
            for (const key in object) {
                if (this.bind.hasOwnProperty(key)) {
                    throw new NeogmaConstraintError(
                        `key ${key} already in the bind param`,
                    );
                }
                this.bind[key] = clone(object[key]);
            }
        }

        return this;
    }

    /** removes the given names from the bind param */
    public remove(names: string | string[]): void {
        const namesToUse = Array.isArray(names) ? names : [names];
        for (const name of namesToUse) {
            delete this.bind[name];
        }
    }

    /**
     * returns the bind attribute
     */
    public get(): BindParam['bind'] {
        return this.bind;
    }

    /** returns a name which isn't a key of bind, and starts with the suffix */
    public getUniqueName(suffix: string): string {
        if (!this.bind.hasOwnProperty(suffix)) {
            return suffix;
        } else {
            const stringSequence = new StringSequence('a', 'zzzz', 4);

            for (
                let generationTry = 0;
                generationTry < 10000;
                generationTry++
            ) {
                const newKey =
                    suffix + '__' + stringSequence.getNextString(true);
                if (!this.bind.hasOwnProperty(newKey)) {
                    return newKey;
                }
            }

            throw new NeogmaError(
                'Max number of tries for string generation reached',
            );
        }
    }

    /** returns a name which isn't a key of bind and adds the value to the bind param with the created name */
    public getUniqueNameAndAdd(
        suffix: Parameters<typeof BindParam['prototype']['getUniqueName']>[0],
        value: Parameters<typeof BindParam['prototype']['add']>[0][0],
    ): string {
        const name = this.getUniqueName(suffix);
        this.add({
            [name]: value,
        });
        return name;
    }

    /**
     * returns a new BindParam instance with a clone of the bind property
     */
    public clone(): BindParam {
        return new BindParam(clone(this.get()));
    }
}
