import { validate } from 'class-validator';
import { Session, StatementResult } from 'neo4j-driver/types/v1';
import { Neo4JJayConstraintError } from '../errors/Neo4JJayConstraintError';
import { Neo4JJayInstanceValidationError } from '../errors/Neo4JJayInstanceValidationError';
import { Neo4JJayNotFoundError } from '../errors/Neo4JJayNotFoundError';
import * as QueryRunner from '../QueryRunner';
import { getWhere } from '../QueryRunner';
import { getSession } from '../Sessions/Sessions';
import { isEmptyObject } from '../utils/object';

export type Neo4JJayModel = ReturnType<typeof ModelFactory>;

const getResultsArray = <T>(result: StatementResult, label: string): T[] => {
    return result.records.map((v) => v.get(label));
};

const getResultArrayFromEdit = <T>(result: StatementResult, label: string): T[] => {
    return result.records.map((v) => v.get(label).properties);
};

const getNodesDeleted = (result: StatementResult): number => {
    return result.summary.counters.nodesDeleted();
};

/** the type of the values to be added to a relationship */
export type RelationshipValuesI = Record<string, string | boolean | number>;

export const RelatedNodesToAssociate = Symbol('RelatedNodesToAssociate');
export const RelationshipValuesToCreate = Symbol('RelationshipValuesToCreate');

/**
 * to get around a typescript bug (TS2538)
 * https://github.com/microsoft/TypeScript/issues/1863
 * https://github.com/Microsoft/TypeScript/issues/24587 
 */
const getSymbolValue = (obj: any, symbol: 'RelatedNodesToAssociateSymbol' | 'RelationshipValuesToCreateSymbol') => {
    if (symbol === 'RelatedNodesToAssociateSymbol') {
        return obj[RelatedNodesToAssociate];
    } else if (symbol === 'RelationshipValuesToCreateSymbol') {
        return obj[RelationshipValuesToCreate];
    }
};

interface GenericConfiguration {
    session?: Session;
}

/** used for defining the type of the RelatedNodesToAssociate interface, to be passed as the second generic to ModelFactory */
export type ModelRelatedNodesI<RelatedModel extends Neo4JJayModel, RelationshipValues extends RelationshipValuesI> = Parameters<RelatedModel['createOne']>[0] & {
    [RelationshipValuesToCreate]?: RelationshipValues
};

/** to be used in create functions where the related nodes can be passed for creation */
export type RelatedNodesCreationParamI<RelatedNodesToAssociateI> = {
    [key in keyof Partial<RelatedNodesToAssociateI>]: RelationshipTypeValueForCreateI<RelatedNodesToAssociateI[key]>;
};

/** the type of the relationship along with the values, so the proper relationship and/or nodes can be created */
type RelationshipTypeValueForCreateI<Attributes extends {
    [RelationshipValuesToCreate]?: RelationshipValuesI;
}> = {
    type: 'array of objects';
    values: Attributes[];
} | {
    type: 'id';
    value: string;
    [RelationshipValuesToCreate]?: Attributes[typeof RelationshipValuesToCreate];
} | {
    type: 'array of ids';
    values: string[];
} | {
    type: 'array of id objects',
    values: Array<{
        id: string;
        [RelationshipValuesToCreate]?: Attributes[typeof RelationshipValuesToCreate];
    }>;
};

/** the type for the Relationship configuration of a Model */
export type RelationshipsI<RelatedNodesToAssociateI> = Array<{
    /** the related model, should only be passed as a string as a final resort, for circular references */
    model: ReturnType<typeof ModelFactory> | 'self',
    /** the label for the relationship */
    label: QueryRunner.CreateRelationshipParamsI['relationship']['label'];
    /** the direction of the relationship */
    direction: 'out' | 'in' | 'none';
    alias: keyof RelatedNodesToAssociateI;
}>;

/**
 * a function which returns a class with the model operation functions for the given Attributes
 * RelatedNodesToAssociateI are the corresponding Nodes for Relationships
 */
export const ModelFactory = <Attributes, RelatedNodesToAssociateI>(params: {
    /** the id key of this model */
    primaryKeyField: string;
    /** the label of the nodes */
    label: string,
    /** relationships with other models or itself */
    relationships?: RelationshipsI<RelatedNodesToAssociateI>;
    /** the model class to be extended */
    modelClass: new (...args: any[]) => any;
}) => {

    const { label, primaryKeyField } = params;
    const relationships = params.relationships || [];

    // enforce unique relationship aliases
    const allRelationshipAlias = relationships.map(({ alias }) => alias);
    if (allRelationshipAlias.length !== new Set(allRelationshipAlias).size) {
        throw new Neo4JJayConstraintError(`Relationship aliases must be unique`, {
            description: relationships,
            actual: allRelationshipAlias,
            expected: [...new Set(allRelationshipAlias)],
        });
    }

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
         * @throws Neo4JJayValidationError
         */
        public async validate(params?: { deep: boolean }) {
            const validationErrors = await validate(this, { whitelist: true });
            if (validationErrors.length) {
                throw new Neo4JJayInstanceValidationError(null, {
                    model: Model,
                    errors: validationErrors,
                });
            }
        }

        /**
         * creates the node, also creating its children nodes and relationships
         * @param {Attributes} data - the data to create, potentially including data for related nodes to be created
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the created data
         */
        public static async createOne(
            data: Attributes & {
                [RelatedNodesToAssociate]?: RelatedNodesCreationParamI<RelatedNodesToAssociateI>;
            },
            configuration?: GenericConfiguration
        ): Promise<Model> {

            configuration = configuration || {};

            const instance = new Model(data);
            await instance.validate();

            return getSession(configuration.session, async (session) => {
                // data to be created don't have RelatedNodesToAssociateSymbol
                const dataToCreate = { ...data };
                delete dataToCreate[RelatedNodesToAssociate];

                const objectsCreateRes = await QueryRunner.createMany(session, label, [dataToCreate]);
                const createdNode = getResultsArray<Attributes>(objectsCreateRes, label)[0];

                // create the relationships if specified
                await this.createRelatedNodes({
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

            return getSession(configuration.session, async (session) => {
                if (!relationships.length) {
                    // if there are no relationships, bulk create them
                    // create and validate the instances
                    const instances = data.map((value) => new Model(value));
                    for (const instance of instances) {
                        await instance.validate();
                    }
                    const res = await QueryRunner.createMany(session, label, instances);
                    const createdNodes = getResultsArray<Attributes>(res, label);
                    // TODO createdNodes may be used in case of fields generated by the database
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

            return getSession(configuration.session, async (session) => {
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

            return getSession(configuration.session, async (session) => {
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

            return getSession(configuration.session, async (session) => {
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

            return getSession(configuration.session, async (session) => {
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

            return getSession(configuration.session, async (session) => {
                const res = await QueryRunner.createRelationship(session, params);
                return res.summary.counters.relationshipsCreated();
            });
        }

        /**
         * creates the related nodes, and the relationship with them
         */
        private static async createRelatedNodes(params: {
            /** the data of the (parent) object, potentially including data for related nodes to be created */
            data: {
                [RelatedNodesToAssociate]?: RelatedNodesCreationParamI<RelatedNodesToAssociateI>;
            };
            /** the id of the created node */
            createdNodeId: string;
            session?: Session;
        }) {

            const { data, session, createdNodeId: createdObjectId } = params;

            // create each given relationship
            for (const alias in data[RelatedNodesToAssociate]) {
                if (!data[RelatedNodesToAssociate].hasOwnProperty(alias)) { continue; }

                const nodeCreateConfiguration: RelationshipTypeValueForCreateI<RelatedNodesToAssociateI[typeof alias]> = data[RelatedNodesToAssociate][alias];

                // find the relationship with this alias
                const relationship = relationships.find((r) => r.alias === alias);
                if (!relationship) {
                    throw new Neo4JJayNotFoundError(`A relationship with the given alias couldn't be found`, { alias });
                }

                const { direction, model: relationshipModel, label } = relationship;

                const createRelationship = (targetId: string | string[], values?: QueryRunner.CreateRelationshipParamsI['relationship']['values']) => {
                    /** the label and primary key of the `b` Model */
                    const otherLabel = relationshipModel === 'self' ? label : relationshipModel.getLabel();
                    const otherPrimaryKeyField = relationshipModel === 'self' ? primaryKeyField : relationshipModel.getPrimaryKeyField();

                    const directionMap: Record<typeof direction, Parameters<typeof Model.createRelationship>[0]['relationship']['direction']> = {
                        in: 'a<-b',
                        out: 'a->b',
                        none: 'a-b',
                    };

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
                                values,
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

                if (nodeCreateConfiguration.type === 'id') {
                    /* for 'id', just create the relationship with the given id */
                    const targetId = nodeCreateConfiguration.value;
                    if (typeof targetId !== 'string') {
                        throw new Neo4JJayConstraintError('Relationship value must be a string', {
                            description: nodeCreateConfiguration,
                            actual: targetId,
                            expected: 'string',
                        });
                    }

                    await createRelationship(targetId, getSymbolValue(nodeCreateConfiguration, 'RelationshipValuesToCreateSymbol'));
                } else if (nodeCreateConfiguration.type === 'array of ids') {
                    /* for 'array of ids', just create the relationship with the given ids */
                    const targetIds = nodeCreateConfiguration.values;
                    /** see if it's an invalid array */
                    if (!(targetIds instanceof Array) || targetIds.find((value) => typeof value !== 'string')) {
                        throw new Neo4JJayConstraintError('Relationship value must be an array of strings', {
                            description: nodeCreateConfiguration,
                            actual: targetIds,
                            expected: 'string[]',
                        });
                    }

                    await createRelationship(targetIds);

                } else if (nodeCreateConfiguration.type === 'array of objects') {
                    /* for 'array of objects', create the nodes and the relationships with them */
                    const nodeCreateConfigurationValues = nodeCreateConfiguration.values;

                    if (!(nodeCreateConfigurationValues instanceof Array)) {
                        throw new Neo4JJayConstraintError('Relationship value must be an array of objects', {
                            description: nodeCreateConfiguration,
                            actual: nodeCreateConfigurationValues,
                            expected: 'object[]',
                        });
                    }

                    /** the primary key field of the target relationship model */
                    const primaryKeyField = relationshipModel === 'self' ? this.getPrimaryKeyField() : relationshipModel.getPrimaryKeyField();

                    /** organize them depending on whether relationship values need to be created, so to single or bulk create them appropriately */
                    const withRelationshipValuesNodesToCreate: Array<typeof nodeCreateConfigurationValues[0]> = [];
                    const withoutRelationshipValuesNodesToCreate: Array<RelatedNodesToAssociateI[Extract<keyof RelatedNodesToAssociateI, string>]> = [];

                    for (const valueToCreate of nodeCreateConfigurationValues) {
                        if (valueToCreate[RelationshipValuesToCreate] && !isEmptyObject(valueToCreate[RelationshipValuesToCreate])) {
                            withRelationshipValuesNodesToCreate.push(valueToCreate);
                        } else {
                            const valueWithoutRelationshipValues = { ...valueToCreate };
                            delete valueWithoutRelationshipValues[RelationshipValuesToCreate];
                            withoutRelationshipValuesNodesToCreate.push(valueWithoutRelationshipValues);
                        }
                    }

                    /* create the nodes without any relationship values */
                    if (withoutRelationshipValuesNodesToCreate.length) {
                        if (relationshipModel === 'self') {
                            /* if it references itself, create nodes of this model */
                            // to get around ts(2345)
                            await this.createMany(withoutRelationshipValuesNodesToCreate as unknown as Attributes[], { session });
                        } else {
                            /* else, create nodes of the model it references */
                            await relationshipModel.createMany(withoutRelationshipValuesNodesToCreate, { session });
                        }

                        /* finally, create all relationships in bulk */
                        await createRelationship(withoutRelationshipValuesNodesToCreate.map((value) => value[primaryKeyField]));
                    }

                    /* create the nodes with relationship values */
                    if (withRelationshipValuesNodesToCreate.length) {
                        /* create single node, and relationship with values */
                        for (const nodeData of withRelationshipValuesNodesToCreate) {

                            // keep the relationshipValues to be created. delete the from the node to create
                            const relationshipValues = nodeData[RelationshipValuesToCreate];
                            const nodeDataToCreate = { ...nodeData };
                            delete nodeDataToCreate[RelationshipValuesToCreate];

                            if (relationshipModel === 'self') {
                                /* if it references itself, create nodes of this model */
                                await this.createOne(nodeDataToCreate as unknown as Attributes, { session });
                            } else {
                                /* else, create nodes of the model it references */
                                await relationshipModel.createOne(nodeDataToCreate as unknown as Attributes, { session });
                            }

                            await createRelationship(nodeDataToCreate[primaryKeyField], relationshipValues);
                        }
                    }

                } else if (nodeCreateConfiguration.type === 'array of id objects') {
                    const nodeCreateConfigurationValues = nodeCreateConfiguration.values;
                    if (!(nodeCreateConfigurationValues instanceof Array)) {
                        throw new Neo4JJayConstraintError('Relationship value must be an array of objects with id as a field', {
                            description: nodeCreateConfiguration,
                            actual: nodeCreateConfigurationValues,
                            expected: 'object[]',
                        });
                    }


                    // Bulk create those without relationship values, and single create those with relationship values
                    const bulkCreateRelationshipIds: string[] = [];
                    for (const valueToCreate of nodeCreateConfigurationValues) {
                        if (typeof valueToCreate.id !== 'string') {
                            throw new Neo4JJayConstraintError('Unspecified id, or not a string', {
                                description: nodeCreateConfiguration,
                                actual: valueToCreate,
                                expected: '{ id: string }',
                            });
                        }

                        if (
                            getSymbolValue(valueToCreate, 'RelationshipValuesToCreateSymbol')
                            && !isEmptyObject(getSymbolValue(valueToCreate, 'RelationshipValuesToCreateSymbol'))
                        ) {
                            await createRelationship(
                                valueToCreate.id,
                                getSymbolValue(valueToCreate, 'RelationshipValuesToCreateSymbol')
                            );
                        } else {
                            bulkCreateRelationshipIds.push(valueToCreate.id);
                        }
                    }

                    await createRelationship(bulkCreateRelationshipIds);
                }

            }

        }

    }

    return Model;
};
