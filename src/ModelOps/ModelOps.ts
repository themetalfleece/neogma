import { validate } from 'class-validator';
import { Session, StatementResult } from 'neo4j-driver/types/v1';
import * as QueryRunner from '../QueryRunner/QueryRunner';
import { getWhere } from '../QueryRunner/Where';
import { acquireSession } from '../Sessions/Sessions';

const getResultsArray = <T>(result: StatementResult, label: string): T[] => {
    return result.records.map((v) => v.get(label));
};

const getResultArrayFromEdit = <T>(result: StatementResult, label: string): T[] => {
    return result.records.map((v) => v.get(label).properties);
};

const getNodesDeleted = (result: StatementResult): number => {
    return result.summary.counters.nodesDeleted();
};

interface GenericConfiguration {
    session?: Session;
}

/** the type of the relationship, with regard to the `field` */
type IRelationshipAnyType = {
    /** 
     * `field` corresponds to an array of objects, which comply to the associated model Attributes 
     * children objects will be created
     */
    type: 'array of objects';

    /** fields of the `field` values which will be properties of the relationship and not the children nodes */
    relationshipFields?: string[];
    /** 
     * whether the field values should be spreaded, and not used for their actual value 
     * example without spread:
     * { since: 1994, status: 'active' }
     * example with spread:
     * { _relationshipValues: { since: 1994, status: 'active' } }
     * both cases will have the same effect
     */
    spreadRelationshipFieldValues?: boolean;
} | {
    /** `field` correspond to a string value, which is the id of the associated node */
    type: 'id';

    /** fields of the `field` values which will be properties of the relationship and not the "parent" (this) node */
    relationshipFields?: string[];
    spreadRelationshipFieldValues?: boolean;
} | {
    /** `field` correspond to an array of strings, which are the ids of the associated nodes. No relationship values can be created */
    type: 'array of ids';
} | {
    /** 
     * `field` corresponds to an array whose entries are object with an id field, and an optional relationship values field
     * They need to have have an array of objects, with an `id` property, and optionally a `relationshipValues` property
     * They must comply to the `IArrayOfIdObjects` type
     */
    type: 'array of id objects',
};

export type IArrayOfIdObjects = Array<{
    id: string;
    relationshipValues?: object;
}>;

export type IRelationships<T> = Array<{
    /** the related model, should only be passed as a string as a final resort, for circular references */
    model: ReturnType<typeof ModelFactory> | 'self',
    /** the field for the reference. It can be a string, array of strings or array of objects */
    field: keyof T;
    /** the label for the relationship */
    label: QueryRunner.CreateRelationshipParamsI['relationship']['label'];
    /** the direction of the relationship */
    direction: 'this->other' | 'this<-other' | 'this-other';
} & IRelationshipAnyType>;

/**
 * a function which returns a class with the model operation functions for the given Attributes
 */
export const ModelFactory = <Attributes>(params: {
    /** the id key of this model */
    primaryKeyField: string;
    /** the label of the nodes */
    label: string,
    /** relationships with other models or itself */
    relationships?: IRelationships<Attributes>;
    /** the model class to be extended */
    modelClass: new (...args: any[]) => any;
}) => {

    const { label, primaryKeyField } = params;
    const relationships = params.relationships || [];
    const relationshipFields = new Set(relationships.map(({ field }) => field));

    class Model extends params.modelClass {

        constructor(data: Attributes) {
            super();
            /** to get around TS2322 */
            const obj = this as any;
            for (const key in data) {
                if (!data.hasOwnProperty(key)) { continue; }
                obj[key] = data[key];
            }
        }

        /**
         * @returns {String} - the label of this Model
         */
        public static getLabel() { return label; }

        /**
         * 
         * @returns {String} - the primary key field of this Model
         */
        public static getPrimaryKeyField() { return primaryKeyField; }

        /**
         * validates the given instance, not with the children models
         * @param {Boolean} params.deep - also validate the children modules
         * @throws Error with the ValidationError[] description
         */
        public async validate(params?: { deep: boolean }) {
            const validationErrors = await validate(this, { whitelist: true });
            if (validationErrors.length) {
                throw new Error(JSON.stringify(validationErrors));
            }

            // also validate the children, by iterating the relationships
            if (params && params.deep) {
                for (const relationship of relationships) {
                    const { field, model: relationshipModel } = relationship;
                    const fieldValue = this[field as string];

                    if (!fieldValue || !(fieldValue instanceof Array)) { continue; }

                    const fieldValueObjects: any[] = fieldValue.filter((value) => value instanceof Object);

                    const modelToUse = relationshipModel === 'self' ? Model : relationshipModel;
                    for (const data of fieldValueObjects) {
                        await new modelToUse(data).validate();
                    }
                }
            }
        }

        /**
         * creates the node, also creating its children nodes and relationships
         * @param {Attributes} data - the data to create
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the created data
         */
        public static async createOne(
            data: Attributes,
            configuration?: GenericConfiguration
        ): Promise<Model> {

            configuration = configuration || {};

            const instance = new Model(data);
            await instance.validate();

            return acquireSession(configuration.session, async (session) => {
                // create the object, without creating data with fields in `relationships`
                // keep only the fields which are not used for relationships
                const dataToCreate: Partial<Attributes> = {};
                for (const key in instance) {
                    if (!instance.hasOwnProperty(key)) { continue; }
                    if (!relationshipFields.has(key as keyof Attributes)) {
                        dataToCreate[key] = data[key];
                    }
                }
                const objectsCreateRes = await QueryRunner.createMany(session, label, [dataToCreate]);
                const createdNode = getResultsArray<Attributes>(objectsCreateRes, label)[0];

                // create the relationships if specified
                await this.createRelationshipsAndChildren({
                    data,
                    createdNodeId: createdNode[primaryKeyField] as unknown as string,
                    session,
                });

                // TODO: push children into the instance under a new field, which should be defined in the Attributes or Model. Its name must be defined in the relationship

                return instance;
            });

        }

        /**
         * creates many nodes. May create them 1-by-1 if there are relationships
         * @param {Attributes[]} data - the data to create
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes[]} - the created data
         */
        public static async createMany(
            data: Attributes[],
            configuration?: GenericConfiguration
        ): Promise<Model[]> {
            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                if (!relationships.length) {
                    // if there are no relationships, bulk create them
                    // create and validate the instances
                    const instances = data.map((value) => new Model(value));
                    for (const instance of instances) {
                        await instance.validate();
                    }
                    const res = await QueryRunner.createMany(session, label, instances);
                    const createdNodes = getResultsArray<Attributes>(res, label); // createdNodes may be used in case of fields generated by the database
                    return instances;
                } else {
                    // else, create them 1-by-1 so the relationships and children are properly created
                    const createdNodes: Model[] = [];
                    for (const nodeData of data) {
                        const createdNode = await this.createOne(nodeData, { session });
                        createdNodes.push(createdNode);
                    }
                    return createdNodes;
                }
            });
        }

        /**
         * 
         * @param {String} id - the id of the node to edit
         * @param {Partial<Attributes>} data - the new data for edit
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the new data of the edited node
         */
        public static async editOne(
            id: string,
            data: Partial<Attributes>,
            configuration?: GenericConfiguration
        ): Promise<Attributes> {

            configuration = configuration || {};

            const where = getWhere({
                [label]: {
                    [primaryKeyField]: id,
                },
            });

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.editMany(session, label, where, data);
                return getResultArrayFromEdit<Attributes>(res, label)[0];
            });
        }

        /**
         * 
         * @param {String[]} ids - the ids of the nodes to edit
         * @param {Partial<Attributes>} data - the new data for edit
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes[]} - the new data of the edited nodes
         */
        public static async editMany(
            ids: string[],
            data: Partial<Attributes>,
            configuration?: GenericConfiguration
        ): Promise<Attributes[]> {

            configuration = configuration || {};

            const where = getWhere({
                [label]: {
                    [primaryKeyField]: { in: ids },
                },
            });

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.editMany(session, label, where, data);
                return getResultArrayFromEdit<Attributes>(res, label);
            });
        }

        /**
         * 
         * @param {String} id - the id of the node to delete
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Boolean} - whether the node was successfully deleted
         */
        public static async deleteOne(
            id: string,
            configuration?: GenericConfiguration
        ): Promise<boolean> {

            configuration = configuration || {};

            const where = getWhere({
                [label]: {
                    [primaryKeyField]: id,
                },
            });

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.deleteMany(
                    session,
                    label,
                    where,
                );
                return getNodesDeleted(res) === 1;
            });
        }

        /**
         * 
         * @param {String[]} ids - the ids of the nodes to delete
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of deleted nodes
         */
        public static async deleteMany(
            ids: string[],
            configuration?: GenericConfiguration
        ): Promise<number> {

            configuration = configuration || {};

            const where = getWhere({
                [label]: {
                    [primaryKeyField]: { in: ids },
                },
            });

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.deleteMany(
                    session,
                    label,
                    where,
                );
                return getNodesDeleted(res);
            });
        }

        /**
         * @param {QueryRunner.CreateRelationshipParamsI} - the parameters including the 2 nodes and the label/direction of the relationship between them
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of created relationships
         */
        public static async createRelationship(
            params: QueryRunner.CreateRelationshipParamsI,
            configuration?: { session?: GenericConfiguration['session'] }
        ): Promise<number> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.createRelationship(session, params);
                return res.summary.counters.relationshipsCreated();
            });
        }

        /**
         * creates the relationships specified in the param, after potentially creating the children from the `field` field
         */
        private static async createRelationshipsAndChildren(params: {
            /** the data of the (parent) object */
            data: Attributes;
            /** the id of the created node */
            createdNodeId: string;
            session?: Session;
        }) {
            if (!relationships.length) { return; }

            const { data, session, createdNodeId: createdObjectId } = params;
            for (const relationship of relationships) {

                const { field, direction, model: relationshipModel, label } = relationship;
                // if the field is not set, continue to the next relationship
                if (!data[field]) { continue; }

                /** maps the relationship direction from the friendly format to the QueryRunner one */
                const directionMap: {
                    [key in IRelationships<Attributes>[0]['direction']]: QueryRunner.CreateRelationshipParamsI['relationship']['direction']
                } = {
                    'this->other': 'a->b',
                    'this-other': 'a-b',
                    'this<-other': 'a<-b',
                };

                const createRelationship = (targetId: string | string[]) => {
                    /** the label and primary key of the `b` Model */
                    const otherLabel = relationshipModel === 'self' ? label : relationshipModel.getLabel();
                    const otherPrimaryKeyField = relationshipModel === 'self' ? primaryKeyField : relationshipModel.getPrimaryKeyField();
                    return this.createRelationship(
                        {
                            a: {
                                label: this.getLabel(),
                            },
                            b: {
                                label: otherLabel,
                            },
                            relationship: {
                                direction: directionMap[direction],
                                label,
                            },
                            where: getWhere({
                                a: {
                                    [primaryKeyField]: createdObjectId,
                                },
                                b: {
                                    [otherPrimaryKeyField]: targetId,
                                },
                            }),
                        },
                        {
                            session,
                        }
                    );
                };

                const fieldValue = data[field];

                if (relationship.type === 'id') {
                    if (typeof fieldValue !== 'string') {
                        throw new Error('Field value must be a string');
                    }

                    await createRelationship(fieldValue);
                } else if (relationship.type === 'array of ids') {
                    if (!(fieldValue instanceof Array)) {
                        throw new Error('Field value must be an array');
                    }

                    const nonStringValue = fieldValue.find((value) => typeof value !== 'string');
                    if (nonStringValue) {
                        throw new Error('Field value must be an array of strings');
                    }

                    await createRelationship(fieldValue);
                } else if (relationship.type === 'array of objects') {
                    if (!(fieldValue instanceof Array)) {
                        throw new Error('Field value must be an array');
                    }

                    if (relationshipModel === 'self') {
                        /** if it references itself, create nodes of this model */
                        await this.createMany(fieldValue, { session });
                    } else {
                        /** else, create nodes of the model it references */
                        await relationshipModel.createMany(fieldValue, { session });
                    }

                    const primaryKeyField = relationshipModel === 'self' ? label : relationshipModel.getLabel();
                    await createRelationship(fieldValue.map((value) => value[primaryKeyField]));
                } else if (relationship.type === 'array of id objects') {
                    if (!(fieldValue instanceof Array)) {
                        throw new Error('Field value must be an array');
                    }

                    for (const value of fieldValue) {
                        if (typeof value.id !== 'string') {
                            throw new Error(`Unspecified id, or not a string`);
                        }
                    }

                    await createRelationship(fieldValue.map((value) => value.id));
                }
            }
        }

    }

    return Model;
};
