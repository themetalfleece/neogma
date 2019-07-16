import { Session, StatementResult } from 'neo4j-driver/types/v1';
import * as QueryRunner from '../QueryRunner/QueryRunner';
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

export type IRelationships<T> = Array<{
    /** the related model, should only be passed as a string as a final resort, for circular references */
    model: ReturnType<typeof ModelOps> | string,
    /** the field for the reference. It can be a string, array of strings or array of objects */
    field: keyof T;
    /** the label for the relationship */
    label: QueryRunner.CreateRelationshipParamsI['relationship']['label'],
    /** the direction of the relationship */
    direction: QueryRunner.CreateRelationshipParamsI['relationship']['direction'],
}>;

/**
 * a function which returns a class with the model operation functions for the given Attributes
 */
export const ModelOps = <Attributes extends { _id: string }>(params: {
    label: string,
    relationships?: IRelationships<Attributes>,
}) => {

    const { label, relationships } = params;

    abstract class ModelOpsAbstract {

        /**
         * @returns {String} -  the label of this Model
         */
        public static getLabel() { return label; }

        /**
         * 
         * @param {Attributes} data - the data to create
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the created data
         */
        public static async createOne(
            data: Attributes,
            configuration?: GenericConfiguration
        ): Promise<Attributes> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                // create the object, without creating data with fields in `relationships`
                const relationshipFields = new Set(relationships ? relationships.map(({ field }) => field) : []);
                // keep only the fields which are not used for relationships
                const dataToCreate: Partial<Attributes> = {};
                for (const key in data) {
                    if (!relationshipFields.has(key)) {
                        dataToCreate[key] = data[key];
                    }
                }
                const objectsCreateRes = await QueryRunner.createMany(session, label, [dataToCreate]);
                const createdNode = getResultsArray<Attributes>(objectsCreateRes, label)[0];

                // create the relationships if specified
                await this.createRelationshipsAndChildren({
                    data,
                    createdNodeId: createdNode._id,
                    session,
                });

                return createdNode;
            });

        }

        /**
         * 
         * @param {Attributes[]} data - the data to create
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes[]} - the created data
         */
        public static async createMany(
            data: Attributes[],
            configuration?: GenericConfiguration
        ): Promise<Attributes[]> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.createMany(session, label, data);
                return getResultsArray<Attributes>(res, label);
            });
        }

        /**
         * 
         * @param {String} _id - the id of the node to edit
         * @param {Partial<Attributes>} data - the new data for edit
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the new data of the edited node
         */
        public static async editOne(
            _id: string,
            data: Partial<Attributes>,
            configuration?: GenericConfiguration
        ): Promise<Attributes> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.editMany(session, label, [_id], data);
                return getResultArrayFromEdit<Attributes>(res, label)[0];
            });
        }

        /**
         * 
         * @param {String[]} _ids - the ids of the nodes to edit
         * @param {Partial<Attributes>} data - the new data for edit
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes[]} - the new data of the edited nodes
         */
        public static async editMany(
            _ids: string[],
            data: Partial<Attributes>,
            configuration?: GenericConfiguration
        ): Promise<Attributes[]> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.editMany(session, label, _ids, data);
                return getResultArrayFromEdit<Attributes>(res, label);
            });
        }

        /**
         * 
         * @param {String} _id - the id of the node to delete
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Boolean} - whether the node was successfully deleted
         */
        public static async deleteOne(
            _id: string,
            configuration?: GenericConfiguration
        ): Promise<boolean> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.deleteMany(session, label, [_id]);
                return getNodesDeleted(res) === 1;
            });
        }

        /**
         * 
         * @param {String[]} _ids - the ids of the nodes to delete
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of deleted nodes
         */
        public static async deleteMany(
            _ids: string[],
            configuration?: GenericConfiguration
        ): Promise<number> {

            configuration = configuration || {};

            return acquireSession(configuration.session, async (session) => {
                const res = await QueryRunner.deleteMany(session, label, _ids);
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
            if (!relationships || !relationships.length) { return; }

            const { data, session, createdNodeId: createdObjectId } = params;
            for (const relationship of relationships) {

                const { field, direction, model, label } = relationship;
                // if the field is not set, continue to the next relationship
                if (!data[field]) { continue; }

                const createRelationship = (_id: string | string[]) => this.createRelationship(
                    {
                        a: {
                            label: this.getLabel(),
                            _id: createdObjectId,
                        },
                        b: {
                            label: typeof model === 'string' ? model : model.getLabel(),
                            _id,
                        },
                        relationship: {
                            direction,
                            label,
                        },
                    },
                    {
                        session,
                    }
                );

                const fieldValue = data[field];

                if (typeof fieldValue === 'string') {
                    // if it's a string, it's the id, so just create the relationship with that id
                    await createRelationship(fieldValue);
                } else if (fieldValue instanceof Array) {
                    // TODO bulk create if the model doesn't have any relationships
                    // also create the children nodes if specified as objects
                    for (const valueData of fieldValue) {
                        if (valueData instanceof Object) {
                            if (typeof model === 'string') {
                                throw new Error(`Cannot create objects of a string-type model`);
                            }
                            await model.createOne(valueData, { session });
                        }
                    }

                    // if it's an array, it's an array of objects or an array or ids, so get the id of each object or use the id
                    await createRelationship(fieldValue.map((value) => typeof value === 'string' ? value : value._id));
                }
            }
        }

    }

    return ModelOpsAbstract;
};
