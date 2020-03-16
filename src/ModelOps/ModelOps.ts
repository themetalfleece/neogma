import { QueryResult, Session } from 'neo4j-driver';
import * as revalidator from 'revalidator';
import { Neo4JJayConstraintError } from '../errors/Neo4JJayConstraintError';
import { Neo4JJayError } from '../errors/Neo4JJayError';
import { Neo4JJayInstanceValidationError } from '../errors/Neo4JJayInstanceValidationError';
import { Neo4JJayNotFoundError } from '../errors/Neo4JJayNotFoundError';
import { Neo4JJay } from '../Neo4JJay';
import { CreateRelationshipParamsI, WhereStatementI } from '../QueryRunner';
import { getWhere } from '../QueryRunner';
import { isEmptyObject } from '../utils/object';

export type Neo4JJayModel = ReturnType<typeof ModelFactory>;

const getResultsArray = <T>(result: QueryResult, label: string): T[] => {
    return result.records.map((v) => v.get(label));
};

const getResultArrayFromEdit = <T>(result: QueryResult, label: string): T[] => {
    return result.records.map((v) => v.get(label).properties);
};

const getNodesDeleted = (result: QueryResult): number => {
    return result.summary.counters.updates().nodesDeleted;
};

/** the type of the values to be added to a relationship */
export type RelationshipValuesI = Record<string, string | boolean | number>;

/** interface used for the keys which will be used on instance creation for associating related notes and creating relationship values */
interface RelationshipCreationKeysI {
    RelatedNodesToAssociate: string;
    RelationshipValuesToCreate: string;
}

interface GenericConfiguration {
    session?: Session;
}

/** used for defining the type of the RelatedNodesToAssociate interface, to be passed as the second generic to ModelFactory */
export interface ModelRelatedNodesI<
    /** the type of the related model */
    RelatedModel extends {
        createOne: (
            data: any,
            configuration?: GenericConfiguration,
        ) => Promise<any>;
    },
    /** the instance of the related model */
    RelatedInstance,
    /** the string which will be used as a key for Relationship Value creation */
    RelationshipValuesToCreateKey extends string,
    /** values for the relationship */
    RelationshipValues extends RelationshipValuesI = {}
    > {
    CreateData: Parameters<RelatedModel['createOne']>[0] & {
        [key in RelationshipValuesToCreateKey]?: RelationshipValues
    };
    Instance: RelatedInstance;
}


/** to be used in create functions where the related nodes can be passed for creation */
export type RelatedNodesCreationParamI<
    RelationshipValuesToCreateKey extends string,
    RelatedNodesToAssociateI extends Record<string, any>
    > = {
        [key in keyof Partial<RelatedNodesToAssociateI>]: RelationshipTypeValueForCreateI<RelationshipValuesToCreateKey, RelatedNodesToAssociateI[key]['CreateData']>;
    };

/** the type of the relationship along with the values, so the proper relationship and/or nodes can be created */
type RelationshipTypeValueForCreateI<RelationshipValuesToCreateKey extends string, Attributes extends {
    [key in RelationshipValuesToCreateKey]?: RelationshipValuesI;
}> =
    (
        {
            type: 'array of objects';
            values: Attributes[];
        }
    ) | (
        {
            type: 'id';
            value: string;
        } & {
            [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
        }
    ) | (
        {
            type: 'array of ids';
            values: string[];
        }
    ) | (
        {
            type: 'array of id objects',
            values: Array<(
                {
                    id: string;
                } & {
                    [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
                }
            )>;
        }
    );

/** the type for the Relationship configuration of a Model */
export type RelationshipsI<
    RelatedNodesToAssociateI extends Record<string, any>,
    > = Array<{
        /** the related model. It could be the object of the model, or "self" for this model */
        model: {
            createOne: (
                data: any,
                configuration?: GenericConfiguration,
            ) => Promise<any>;
            createMany: (
                data: any[],
                configuration?: GenericConfiguration,
            ) => Promise<any[]>;
            getLabel: () => string;
            getPrimaryKeyField: () => string;
        } | 'self', // we can't use the actual Neo4JJayModel type due to circular references
        /** the label for the relationship */
        label: CreateRelationshipParamsI['relationship']['label'];
        /** the direction of the relationship */
        direction: 'out' | 'in' | 'none';
        alias: keyof RelatedNodesToAssociateI;
    }>;

/** the type of instance of the Model */
export type Neo4JJayInstance<
    /** the Model that this instance belongs to */
    Model extends new (...args) => any,
    /** the attributes used in the Model */
    Attributes,
    /** the Related Nodes to Associate used in the Model */
    RelatedNodesToAssociateI extends Record<string, any>,
    /** the Methods used in the Model */
    MethodsI extends Record<string, any> = {},
    > = Attributes & InstanceType<Model> & MethodsI & {
        [key in keyof RelatedNodesToAssociateI]?: Array<RelatedNodesToAssociateI[key]['Instance']>;
    };

/**
 * a function which returns a class with the model operation functions for the given Attributes
 * RelatedNodesToAssociateI are the corresponding Nodes for Relationships
 */
export const ModelFactory = <
    /** the base Attribute of the node */
    Attributes,
    /** related nodes to associate. Label-ModelRelatedNodesI pairs */
    RelatedNodesToAssociateI extends Record<string, any>,
    /** the string which will be used as a key for Related Nodes creation */
    RelatedNodesToAssociateKey extends string,
    /** interface for the statics of the model */
    StaticsI extends Record<string, any> = {},
    /** interface for the methods of the instance */
    MethodsI extends Record<string, any> = {},
    >(
        params: {
            /** the id key of this model */
            primaryKeyField: string;
            /** the label of the nodes */
            label: string,
            /** relationships with other models or itself */
            relationships?: RelationshipsI<RelatedNodesToAssociateI>;
            /** the keys which will be used on instance creation for associating related notes and creating relationship values */
            relationshipCreationKeys: RelationshipCreationKeysI;
            /** the schema for the validation */
            schema: {
                [index in keyof Attributes]: Revalidator.ISchema<Attributes> | Revalidator.JSONSchema<Attributes>;
            };
            statics?: StaticsI;
            methods?: MethodsI;
        },
        neo4jjay: Neo4JJay,
) => {

    /** type used for creating nodes. It includes their Attributes and Related Nodes */
    type CreateDataI = Attributes & {
        [key in RelatedNodesToAssociateKey]?: RelatedNodesCreationParamI<RelatedNodesToAssociateKey, RelatedNodesToAssociateI>;
    };

    const { label, primaryKeyField, relationshipCreationKeys, schema } = params;
    const statics = params.statics || {};
    const methods = params.methods || {};
    const relationships = params.relationships || [];

    const queryRunner = neo4jjay.getQueryRunner();
    const getSession = neo4jjay.getSession;

    const attributeKeysSet = new Set(Object.keys(schema));

    // enforce unique relationship aliases
    const allRelationshipAlias = relationships.map(({ alias }) => alias);
    if (allRelationshipAlias.length !== new Set(allRelationshipAlias).size) {
        throw new Neo4JJayConstraintError(`Relationship aliases must be unique`, {
            description: relationships,
            actual: allRelationshipAlias,
            expected: [...new Set(allRelationshipAlias)],
        });
    }

    type Instance = Neo4JJayInstance<typeof Model, Attributes, RelatedNodesToAssociateI, MethodsI>;

    class Model {

        /** whether this instance already exists in the database or it new */
        private existsInDatabase = false;

        /**
         * @returns {String} - the label of this Model
         */
        public static getLabel() { return label; }

        /**
         * 
         * @returns {String} - the primary key field of this Model
         */
        public static getPrimaryKeyField() { return primaryKeyField; }

        public static getRelationshipCreationKeys() { return relationshipCreationKeys; }

        public getDataValues(): Attributes {
            const data: Attributes = Object.keys(schema).reduce((acc, key) => {
                acc[key] = this[key];
                return acc;
            }, {} as Attributes);

            return data;
        }

        /**
         * validates the given instance, not with the children models
         * @param {Boolean} params.deep - also validate the children nodes
         * @throws Neo4JJayValidationError
         */
        public async validate(params?: { deep: boolean }) {
            const validationResult = revalidator.validate(this.getDataValues(), {
                type: 'object',
                properties: schema,
            });

            // TODO also implement deep
            if (validationResult.errors.length) {
                throw new Neo4JJayInstanceValidationError(null, {
                    model: Model,
                    errors: validationResult.errors,
                });
            }
        }

        /**
         * creates a proper Instance of this Model
         */
        public static build(data: CreateDataI): Instance {
            const instance = new Model() as Instance;
            for (const key in data) {
                // set the key if it's in the allowed attribute keys specified by the schema or any of the relationship creation keys
                if (
                    key !== relationshipCreationKeys.RelatedNodesToAssociate &&
                    key !== relationshipCreationKeys.RelationshipValuesToCreate &&
                    (!data.hasOwnProperty(key) || !(attributeKeysSet.has(key)))
                ) {
                    continue;
                }
                instance[key as keyof typeof instance] = data[key];
            }
            return instance;
        }

        /**
         * saves an instance to the database. If it's new it creates it, and if it already exists it edits it
         */
        public save(_configuration?: GenericConfiguration & {
            /** whether to validate this instance, defaults to true */
            validate?: boolean;
        }) {
            const instance = this as unknown as Instance;
            const configuration = {
                validate: true,
                ..._configuration,
            };

            return getSession(_configuration?.session, async (session) => {
                if (configuration.validate) {
                    await instance.validate();
                }
                // if it's a new one - it doesn't exist in the database yet, need to create it
                if (!instance.existsInDatabase) {
                    return instance.createFromInstance(instance, session);
                }
                // TODO if it already exists, need to edit it
            });
        }

        /**
         * creates the node, also creating its children nodes and relationships
         * @param {Attributes} data - the data to create, potentially including data for related nodes to be created
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes} - the created data
         */
        public static async createOne(
            data: CreateDataI,
            configuration?: GenericConfiguration
        ): Promise<Instance> {
            configuration = configuration || {};

            const instance = Model.build(data);
            await instance.validate();

            return getSession(configuration.session, async (session) => {
                return instance.createFromInstance(data, session);
            });
        }

        /** calls createMany and createRelatedNodes for the instance data values */
        private async createFromInstance(data: CreateDataI | Instance, session: Session) {
            const dataToCreate = { ...this.getDataValues() };

            const objectsCreateRes = await queryRunner.createMany(session, label, [dataToCreate]);
            const createdNode = getResultsArray<Attributes>(objectsCreateRes, label)[0];

            // create the relationships if specified
            await Model.createRelatedNodes({
                data,
                createdNodeId: createdNode[primaryKeyField] as unknown as string,
                session,
            });

            // TODO: push children into the instance under a new field, which should be the relationship alias

            this.existsInDatabase = true;

            return this;
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
        ): Promise<Instance[]> {
            configuration = configuration || {};

            return getSession(configuration.session, async (session) => {
                if (!relationships.length) {
                    // if there are no relationships, bulk create them
                    // create and validate the instances
                    const instances = data.map((value) => Model.build(value));
                    for (const instance of instances) {
                        await instance.validate();
                    }
                    const res = await queryRunner.createMany(session, label, instances);
                    const createdNodes = getResultsArray<Attributes>(res, label);
                    // TODO createdNodes may be used in case of fields generated by the database - need to replace values of the nodes to the created ones
                    // TODO also set existsInDatabase of created nodes
                    return instances;
                } else {
                    // else, create them 1-by-1 so the relationships and children are properly created
                    const createdNodes: Instance[] = [];
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
                const res = await queryRunner.editMany(session, label, data, where);
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
                const res = await queryRunner.editMany(session, label, data, where);
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
                const res = await queryRunner.deleteMany(
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
                const res = await queryRunner.deleteMany(
                    session,
                    label,
                    where,
                );
                return getNodesDeleted(res);
            });
        }

        /** creates a relationship by using the configuration specified in "relationships" from the given alias */
        public static async relateTo(
            params: {
                alias: keyof RelatedNodesToAssociateI;
                /** can access query labels by `source` and `target` */
                where?: WhereStatementI;
                values?: object;
            },
            configuration?: {
                /** throws an error if the number of created relationships don't equal to this number */
                assertCreatedRelationships?: number;
                session?: GenericConfiguration['session'];
            }
        ) {
            configuration = configuration || {};

            const relationship = relationships.find((relationship) => relationship.alias === params.alias);

            if (!relationship) {
                throw new Neo4JJayNotFoundError(`The relationship of the alias ${params.alias} can't be found for the model ${label}`);
            }

            return getSession(configuration.session, async (session) => {
                const res = await queryRunner.createRelationship(
                    session,
                    {
                        source: {
                            label,
                        },
                        target: {
                            label: Model.getLabelFromRelationshipModel(relationship.model),
                        },
                        relationship: {
                            label: relationship.label,
                            direction: relationship.direction,
                            values: {},
                        },
                        where: params.where,
                    }
                );
                const relationshipsCreated = res.summary.counters.updates().relationshipsCreated;

                const { assertCreatedRelationships } = configuration;
                if (assertCreatedRelationships && relationshipsCreated !== assertCreatedRelationships) {
                    throw new Neo4JJayError(
                        `Not all required relationships were created`,
                        {
                            assertCreatedRelationships,
                            relationshipsCreated,
                            ...params,
                        },
                    );
                }

                return relationshipsCreated;
            });
        }

        /**
         * @param {queryRunner.CreateRelationshipParamsI} - the parameters including the 2 nodes and the label/direction of the relationship between them
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of created relationships
         */
        public static async createRelationship(
            /** for "where", can access query labels by `source` and `target` */
            params: CreateRelationshipParamsI,
            configuration?: {
                /** throws an error if the number of created relationships don't equal to this number */
                assertCreatedRelationships?: number;
                session?: GenericConfiguration['session'];
            }
        ): Promise<number> {
            configuration = configuration || {};

            return getSession(configuration.session, async (session) => {
                const res = await queryRunner.createRelationship(session, params);
                const relationshipsCreated = res.summary.counters.updates().relationshipsCreated;

                const { assertCreatedRelationships } = configuration;
                if (assertCreatedRelationships && relationshipsCreated !== assertCreatedRelationships) {
                    throw new Neo4JJayError(
                        `Not all required relationships were created`,
                        {
                            assertCreatedRelationships,
                            relationshipsCreated,
                            ...params,
                        },
                    );
                }

                return relationshipsCreated;
            });
        }

        /**
         * creates the related nodes, and the relationship with them
         */
        private static async createRelatedNodes(params: {
            /** the data of the (parent) object, potentially including data for related nodes to be created */
            data: {
                [key in RelatedNodesToAssociateKey]?: RelatedNodesCreationParamI<RelatedNodesToAssociateKey, RelatedNodesToAssociateI>;
            };
            /** the id of the created node */
            createdNodeId: string;
            session?: Session;
        }) {

            const { data, session, createdNodeId: createdObjectId } = params;

            // create each given relationship
            for (const _alias in data[relationshipCreationKeys.RelatedNodesToAssociate]) {
                if (!data[relationshipCreationKeys.RelatedNodesToAssociate].hasOwnProperty(_alias)) { continue; }
                const alias = _alias as keyof RelatedNodesToAssociateI;

                const nodeCreateConfiguration: RelationshipTypeValueForCreateI<RelatedNodesToAssociateKey, RelatedNodesToAssociateI[typeof alias]['CreateData']> = data[relationshipCreationKeys.RelatedNodesToAssociate][alias];

                // find the relationship with this alias
                const relationship = relationships.find((r) => r.alias === alias);
                if (!relationship) {
                    throw new Neo4JJayNotFoundError(`A relationship with the given alias couldn't be found`, { alias });
                }

                const { direction, model: relationshipModel, label } = relationship;

                const createRelationship = (
                    targetId: string | string[],
                    values?: CreateRelationshipParamsI['relationship']['values'],
                ) => {
                    /** the label and primary key of the `b` Model */
                    const targetLabel = Model.getLabelFromRelationshipModel(relationshipModel);
                    const otherPrimaryKeyField = Model.getPrimaryKeyFieldFromRelationshipModel(relationshipModel);

                    return this.createRelationship(
                        {
                            source: {
                                label: this.getLabel(),
                            },
                            target: {
                                label: targetLabel,
                            },
                            relationship: {
                                direction,
                                label,
                                values,
                            },
                            where: getWhere({
                                source: {
                                    [primaryKeyField]: createdObjectId,
                                },
                                target: {
                                    [otherPrimaryKeyField]: targetId,
                                },
                            }),
                        },
                        {
                            assertCreatedRelationships: typeof targetId === 'string' ? 1 : targetId.length,
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

                    await createRelationship(targetId, nodeCreateConfiguration[relationshipCreationKeys.RelatedNodesToAssociate]);
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
                    const primaryKeyField = Model.getPrimaryKeyFieldFromRelationshipModel(relationshipModel);

                    /** organize them depending on whether relationship values need to be created, so to single or bulk create them appropriately */
                    const withRelationshipValuesNodesToCreate: Array<typeof nodeCreateConfigurationValues[0]> = [];
                    const withoutRelationshipValuesNodesToCreate: Array<RelatedNodesToAssociateI[Extract<keyof RelatedNodesToAssociateI, string>]> = [];

                    for (const valueToCreate of nodeCreateConfigurationValues) {
                        if (valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate] && !isEmptyObject(valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate])) {
                            withRelationshipValuesNodesToCreate.push(valueToCreate);
                        } else {
                            const valueWithoutRelationshipValues = { ...valueToCreate };
                            delete valueWithoutRelationshipValues[relationshipCreationKeys.RelationshipValuesToCreate];
                            withoutRelationshipValuesNodesToCreate.push(valueWithoutRelationshipValues as RelatedNodesToAssociateI[Extract<keyof RelatedNodesToAssociateI, string>]);
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
                            const relationshipValues = nodeData[relationshipCreationKeys.RelationshipValuesToCreate];
                            const nodeDataToCreate = { ...nodeData };
                            delete nodeDataToCreate[relationshipCreationKeys.RelationshipValuesToCreate];

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
                            valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate]
                            && !isEmptyObject(valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate])
                        ) {
                            await createRelationship(
                                valueToCreate.id,
                                valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate]
                            );
                        } else {
                            bulkCreateRelationshipIds.push(valueToCreate.id);
                        }
                    }

                    await createRelationship(bulkCreateRelationshipIds);
                }

            }

        }

        /** gets the label from the given model for a relationship */
        private static getLabelFromRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? label : relationshipModel.getLabel();
        }

        /** gets the primary key field from the given model for a relationship */
        private static getPrimaryKeyFieldFromRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? primaryKeyField : relationshipModel.getPrimaryKeyField();
        }

    }

    for (const staticKey in statics) {
        if (!statics.hasOwnProperty(staticKey)) { continue; }
        Model[staticKey as keyof typeof Model] = statics[staticKey];
    }

    for (const methodKey in methods) {
        if (!methods.hasOwnProperty(methodKey)) { continue; }
        Model.prototype[methodKey as keyof typeof Model.prototype] = methods[methodKey];
    }

    return Model as (typeof Model) & StaticsI;
};
