import { QueryResult, Session } from 'neo4j-driver';
import * as revalidator from 'revalidator';
import { NeogmaConstraintError } from '../errors/NeogmaConstraintError';
import { NeogmaError } from '../errors/NeogmaError';
import { NeogmaInstanceValidationError } from '../errors/NeogmaInstanceValidationError';
import { NeogmaNotFoundError } from '../errors/NeogmaNotFoundError';
import { Neogma } from '../Neogma';
import { BindParam, CreateRelationshipParamsI, Neo4jSupportedTypes, QueryRunner, Where, WhereParamsByIdentifierI, WhereParamsI, WhereValuesI } from '../QueryRunner';
import { isEmptyObject } from '../utils/object';

export type NeogmaModel = ReturnType<typeof ModelFactory>;

const getResultsArray = <T>(result: QueryResult, identifier: string): T[] => {
    return result.records.map((v) => v.get(identifier).properties);
};

const getResultArrayFromEdit = <T>(result: QueryResult, identifier: string): T[] => {
    return result.records.map((v) => v.get(identifier).properties);
};

const getNodesDeleted = (result: QueryResult): number => {
    return result.summary.counters.updates().nodesDeleted;
};

/** the type of the values to be added to a relationship */
export type RelationshipValuesI = Record<string, Neo4jSupportedTypes>;

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
            values: Array<
                {
                    id: string;
                } & {
                    [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
                }
            >;
        }
    ) | (
        {
            type: 'where';
            /** where for the target nodes */
            where: WhereParamsI;
        } & {
            [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
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
            getLabel: () => string | string[];
            getPrimaryKeyField: () => string;
        } | 'self', // we can't use the actual NeogmaModel type due to circular references
        /** the name of the relationship */
        name: CreateRelationshipParamsI['relationship']['name'];
        /** the direction of the relationship */
        direction: 'out' | 'in' | 'none';
        alias: keyof RelatedNodesToAssociateI;
    }>;

/** the type of instance of the Model */
export type NeogmaInstance<
    /** the Model that this instance belongs to */
    Model extends new (...args) => any,
    /** the attributes used in the Model */
    Attributes,
    /** the Methods used in the Model */
    MethodsI extends Record<string, any> = {},
    > = Attributes & InstanceType<Model> & MethodsI;

export type FindManyIncludeI<AliasKeys> = {
    alias: AliasKeys;
    /** where params for the nodes of the included Model */
    where?: WhereParamsI;
    /** default false */
    optional?: boolean;
    include?: FindManyIncludeI<any>;
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
        parameters: {
            /** the id key of this model */
            primaryKeyField: string;
            /** the label of the nodes */
            label: string | string[],
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
        neogma: Neogma,
) => {

    /** type used for creating nodes. It includes their Attributes and Related Nodes */
    type CreateDataI = Attributes & {
        [key in RelatedNodesToAssociateKey]?: RelatedNodesCreationParamI<RelatedNodesToAssociateKey, RelatedNodesToAssociateI>;
    };

    const { label: modelLabel, primaryKeyField: modelPrimaryKeyField, relationshipCreationKeys, schema } = parameters;
    const statics = parameters.statics || {};
    const methods = parameters.methods || {};
    const relationships = parameters.relationships || [];
    /* helper name for queries */
    const modelName = (modelLabel instanceof Array ? modelLabel : [modelLabel]).join('');

    const queryRunner = neogma.getQueryRunner();
    const getSession = neogma.getSession;

    // enforce unique relationship aliases
    const allRelationshipAlias = relationships.map(({ alias }) => alias);
    if (allRelationshipAlias.length !== new Set(allRelationshipAlias).size) {
        throw new NeogmaConstraintError(`Relationship aliases must be unique`, {
            description: relationships,
            actual: allRelationshipAlias,
            expected: [...new Set(allRelationshipAlias)],
        });
    }

    type Instance = NeogmaInstance<typeof Model, Attributes, MethodsI>;

    class Model {

        /** whether this instance already exists in the database or it new */
        private __existsInDatabase;

        /** the data of Attributes */
        private dataValues: Attributes;
        /** the changed attributes of this instance, to be taken into account when saving it */
        public changed: Record<keyof Attributes, boolean>;

        /**
         * @returns {String} - the label of this Model
         */
        public static getLabel() { return modelLabel; }

        /**
         * 
         * @returns {String} - the primary key field of this Model
         */
        public static getPrimaryKeyField() { return modelPrimaryKeyField; }

        public static getRelationshipCreationKeys() { return relationshipCreationKeys; }

        public static getModelName() { return modelName; }

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
         * @throws NeogmaInstanceValidationError
         */
        public async validate(params?: { deep: boolean }) {
            const validationResult = revalidator.validate(this.getDataValues(), {
                type: 'object',
                properties: schema,
            });

            // TODO also implement deep
            if (validationResult.errors.length) {
                throw new NeogmaInstanceValidationError(null, {
                    model: Model,
                    errors: validationResult.errors,
                });
            }
        }

        /**
         * builds data Instance by data, setting information fields appropriately
         * status 'new' can be called publicly (hence the .build wrapper), but 'existing' should be used only internally when building instances after finding nodes from the database
         */
        private static __build(data: CreateDataI, { status }: {
            status: 'new' | 'existing'
        }) {
            const instance = new Model() as Instance;

            instance.__existsInDatabase = status === 'existing';

            instance.dataValues = {} as Attributes;
            instance.changed = {} as Record<keyof Attributes, boolean>;

            for (const _key of [...Object.keys(schema), ...Object.values(relationshipCreationKeys)]) {
                const key = _key as keyof typeof schema;

                /* set dataValues using data */
                if (data.hasOwnProperty(key)) {
                    instance.dataValues[key] = data[key];
                    instance.changed[key] = status === 'new';
                }

                /* set the setters and getters of the keys */
                Object.defineProperty(instance, key, {
                    get: () => {
                        return instance.dataValues[key];
                    },
                    set: (val) => {
                        instance.dataValues[key] = val;
                        instance.changed[key] = true;
                    },
                });
            }
            return instance;
        }

        /**
         * creates a new Instance of this Model, which can be saved to the database
         */
        public static build(data: CreateDataI): Instance {
            return Model.__build(data, { status: 'new' });
        }

        /**
         * saves an instance to the database. If it's new it creates it, and if it already exists it edits it
         */
        public save(_configuration?: GenericConfiguration & {
            /** whether to validate this instance, defaults to true */
            validate?: boolean;
        }): Promise<Instance> {
            const instance = this as unknown as Instance;
            const configuration = {
                validate: true,
                ..._configuration,
            };

            return getSession<Instance>(_configuration?.session, async (session) => {
                if (configuration.validate) {
                    await instance.validate();
                }

                if (instance.__existsInDatabase) {
                    // if it exists in the database, update the node by only the fields which have changed
                    const updateData = Object.entries(instance.changed).reduce((val, [key, changed]) => {
                        if (changed) {
                            val[key] = instance[key];
                        }
                        return val;
                    }, {});

                    await Model.update(
                        updateData,
                        {
                            return: false,
                            session,
                            where: {
                                [modelPrimaryKeyField]: instance[modelPrimaryKeyField],
                            },
                        }
                    );

                    // set all changed to false
                    for (const key in this.changed) {
                        if (!this.changed.hasOwnProperty(key)) { continue; }
                        this.changed[key] = false;
                    }
                    return instance;
                } else {
                    // if it's a new one - it doesn't exist in the database yet, need to create it
                    return instance.createFromInstance(instance, session);
                }
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

            const instance = Model.__build(data, { status: 'new' });
            await instance.validate();

            return getSession(configuration?.session, async (session) => {
                return instance.createFromInstance(data, session);
            });
        }

        /** calls createMany and createRelatedNodes for the instance data values */
        private async createFromInstance(data: CreateDataI | Instance, session: Session) {
            const dataToCreate = { ...this.getDataValues() };

            const objectsCreateRes = await queryRunner.create(
                session,
                {
                    label: QueryRunner.getNormalizedLabels(modelLabel),
                    data: [dataToCreate],
                    identifier: 'nodes',
                }
            );
            const createdNode = getResultsArray<Attributes>(objectsCreateRes, 'nodes')[0];

            // create the relationships if specified
            await Model.createRelatedNodes({
                data,
                createdNodeId: createdNode[modelPrimaryKeyField] as unknown as string,
                session,
            });

            // TODO: push children into the instance under a new field, which should be the relationship alias

            // this exists in the database, and set all changed to false
            this.__existsInDatabase = true;
            for (const key in this.changed) {
                if (!this.changed.hasOwnProperty(key)) { continue; }
                this.changed[key] = false;
            }

            return this;
        }

        /**
         * creates many nodes. May create them 1-by-1 if there are relationships
         * @param {CreateDataI[]} data - the data to create
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Attributes[]} - the created data
         */
        public static async createMany(
            data: CreateDataI[],
            configuration?: GenericConfiguration
        ): Promise<Instance[]> {
            configuration = configuration || {};

            return getSession(configuration?.session, async (session) => {
                if (!relationships.length) {
                    // if there are no relationships, bulk create them
                    // create and validate the instances
                    const instances = data.map((value) => Model.__build(value, { status: 'new' }));
                    for (const instance of instances) {
                        await instance.validate();
                    }
                    const res = await queryRunner.create(
                        session,
                        {
                            label: QueryRunner.getNormalizedLabels(modelLabel),
                            data: instances,
                            identifier: 'nodes',
                        }
                    );
                    const createdNodes = getResultsArray<Attributes>(res, 'nodes');
                    // TODO createdNodes may be used in case of fields generated by the database - need to replace values of the nodes to the created ones
                    // TODO also set __existsInDatabase of created nodes
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

        public static async update(
            data: Partial<Attributes>,
            params?: GenericConfiguration & {
                where?: WhereParamsI;
                /** defaults to false. Whether to return the values of the nodes after the update. If it's false, the first entry of the return value of this function will be an empty array */
                return?: boolean;
            }
        ): Promise<[Instance[], QueryResult]> {
            const normalizedLabel = QueryRunner.getNormalizedLabels(modelLabel);
            const identifier = 'node';

            const where = params?.where ? {
                [identifier]: params.where,
            } : null;

            return getSession(params?.session, async (session) => {
                const res = await queryRunner.update(session,
                    {
                        label: normalizedLabel,
                        data,
                        where,
                        identifier,
                    }
                );
                const nodeAttributes = params?.return ? getResultArrayFromEdit<Attributes>(res, identifier) : [];

                const instances = nodeAttributes.map((v) => Model.__build(v, { status: 'existing' }));
                return [instances, res] as [Instance[], QueryResult];
            });
        }

        public static async updateRelationship(
            data: object,
            params: {
                alias: keyof RelatedNodesToAssociateI;
                where?: {
                    source?: WhereParamsI;
                    target?: WhereParamsI;
                    relationship?: WhereParamsI;
                };
                session?: GenericConfiguration['session'];
            }
        ) {
            const relationship = relationships.find((r) => r.alias === params.alias);

            if (!relationship) {
                throw new NeogmaNotFoundError(`The relationship of the alias ${params.alias} can't be found for the model ${modelLabel}`);
            }

            return getSession(params?.session, async (session) => {
                const identifiers = {
                    source: 'source',
                    target: 'target',
                    relationship: 'r',
                };
                const labels = {
                    source: QueryRunner.getNormalizedLabels(modelLabel),
                    target: QueryRunner.getNormalizedLabels(Model.getLabelFromRelationshipModel(relationship.model)),
                };

                const where: Where = new Where({});
                if (params.where?.source) {
                    where.addParams({ [identifiers.source]: params.where.source });
                }
                if (params.where?.target) {
                    where.addParams({ [identifiers.target]: params.where.target });
                }
                if (params.where?.relationship) {
                    where.addParams({ [identifiers.relationship]: params.where.relationship });
                }

                const { getIdentifierWithLabel } = QueryRunner;

                const directionAndNameString = QueryRunner.getRelationshipDirectionAndName({
                    direction: relationship.direction,
                    name: relationship.name,
                    identifier: identifiers.relationship,
                });

                /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
                const updateBindParam = where.bindParam.clone();

                const { statement: setStatement } = QueryRunner.getSetParts({
                    bindParam: updateBindParam,
                    data,
                    identifier: identifiers.relationship,
                });

                const statementParts: string[] = [];

                statementParts.push(`
                    MATCH
                    (${getIdentifierWithLabel(identifiers.source, labels.source)})
                    ${directionAndNameString}
                    (${getIdentifierWithLabel(identifiers.target, labels.target)})
                `);

                if (where.statement) {
                    statementParts.push(`WHERE ${where.statement}`);
                }

                statementParts.push(setStatement);

                return queryRunner.run(session,
                    statementParts.join(' '),
                    updateBindParam.get(),
                );

            });
        }

        public async updateRelationship(
            data: Parameters<typeof Model.updateRelationship>[0],
            params: Omit<Parameters<typeof Model.updateRelationship>[1], 'where'> & {
                where: Omit<Parameters<typeof Model.updateRelationship>[1]['where'], 'source'>
            }
        ) {
            return Model.updateRelationship(data, {
                ...params,
                where: {
                    ...params.where,
                    source: {
                        [modelPrimaryKeyField]: this[modelPrimaryKeyField],
                    },
                },
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

            const normalizedLabel = QueryRunner.getNormalizedLabels(modelLabel);
            const where = {
                [normalizedLabel]: {
                    [modelPrimaryKeyField]: id,
                },
            };

            return getSession(configuration?.session, async (session) => {
                const res = await queryRunner.delete(
                    session,
                    normalizedLabel,
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

            const normalizedLabel = QueryRunner.getNormalizedLabels(modelLabel);
            const where = {
                [normalizedLabel]: {
                    [modelPrimaryKeyField]: { in: ids },
                },
            };

            return getSession(configuration?.session, async (session) => {
                const res = await queryRunner.delete(
                    session,
                    normalizedLabel,
                    where,
                );
                return getNodesDeleted(res);
            });
        }

        public static async findMany(
            params?: GenericConfiguration & {
                /** where params for the nodes of this Model */
                where?: WhereParamsI;
                limit?: number;
                order?: Array<[keyof Attributes, 'ASC' | 'DESC']>;
            },
        ): Promise<Instance[]> {
            return getSession(params?.session, async (session) => {
                const normalizedLabel = QueryRunner.getNormalizedLabels(this.getLabel());

                const rootIdentifier = modelName;

                const bindParam = new BindParam();
                const rootWhere = params.where && new Where({
                    [rootIdentifier]: params.where,
                }, bindParam);

                const statementParts: string[] = [];
                /** the properties for the return statement */
                const returnProperties: string[] = [];

                /* match the nodes of this Model */
                statementParts.push(`
                    MATCH (${rootIdentifier}:${normalizedLabel})
                `);
                if (rootWhere) {
                    statementParts.push(`
                        WHERE ${rootWhere.statement}
                    `);
                }
                returnProperties.push(rootIdentifier);

                /* add the return statement from the returnProperties */
                statementParts.push(`
                    RETURN ${returnProperties.join(', ')}
                `);

                if (params?.order) {
                    statementParts.push(`
                        ORDER BY ${params.order.map(([field, direction]) => `${rootIdentifier}.${field} ${direction}`).join(', ')}
                    `);
                }

                if (params?.limit) {
                    statementParts.push(`LIMIT ${params.limit}`);
                }

                const statement = statementParts.join(' ');
                const res = await queryRunner.run(session, statement, bindParam.get());

                const instances = res.records.map((record) => {
                    const node = record.get(rootIdentifier);
                    const data: Attributes = node.properties;
                    const instance = Model.__build(data, { status: 'existing' });
                    instance.__existsInDatabase = true;
                    return instance;
                });

                return instances;
            });
        }

        public static async findOne(
            params?: Omit<Parameters<typeof Model.findMany>[0], 'limit'>
        ): Promise<Instance> {
            return getSession(params?.session, async (session) => {
                const instances = await Model.findMany({
                    ...params,
                    session,
                    limit: 1,
                });
                return instances[0];
            });
        }

        /** creates a relationship by using the configuration specified in "relationships" from the given alias */
        public static async relateTo(
            params: {
                alias: keyof RelatedNodesToAssociateI;
                where: {
                    source: WhereParamsI;
                    target: WhereParamsI;
                };
                values?: object;
            },
            configuration?: {
                /** throws an error if the number of created relationships don't equal to this number */
                assertCreatedRelationships?: number;
                session?: GenericConfiguration['session'];
            }
        ) {
            configuration = configuration || {};

            const relationship = relationships.find((r) => r.alias === params.alias);

            if (!relationship) {
                throw new NeogmaNotFoundError(`The relationship of the alias ${params.alias} can't be found for the model ${modelLabel}`);
            }

            return getSession(configuration?.session, async (session) => {
                const where: WhereParamsByIdentifierI = {};
                if (params.where) {
                    where[QueryRunner.identifiers.createRelationship.source] = params.where.source;
                    where[QueryRunner.identifiers.createRelationship.target] = params.where.target;
                }

                const res = await queryRunner.createRelationship(
                    session,
                    {
                        source: {
                            label: QueryRunner.getNormalizedLabels(modelLabel),
                        },
                        target: {
                            label: QueryRunner.getNormalizedLabels(Model.getLabelFromRelationshipModel(relationship.model)),
                        },
                        relationship: {
                            name: relationship.name,
                            direction: relationship.direction,
                            values: {},
                        },
                        where,
                    }
                );
                const relationshipsCreated = res.summary.counters.updates().relationshipsCreated;

                const { assertCreatedRelationships } = configuration;
                if (assertCreatedRelationships && relationshipsCreated !== assertCreatedRelationships) {
                    throw new NeogmaError(
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

        /** wrapper for the static relateTo, where the source is always this node */
        public async relateTo(
            params: Omit<Parameters<typeof Model.relateTo>[0], 'where'> & {
                where: WhereParamsI;
            },
            configuration?: Parameters<typeof Model.relateTo>[1]
        ) {
            const where: Parameters<typeof Model.relateTo>[0]['where'] = {
                source: {
                    _id: this[modelPrimaryKeyField],
                },
                target: params.where,
            };

            return Model.relateTo(
                {
                    ...params,
                    where,
                },
                configuration,
            );
        }

        /**
         * @param {queryRunner.CreateRelationshipParamsI} - the parameters including the 2 nodes and the label/direction of the relationship between them
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of created relationships
         */
        public static async createRelationship(
            params: CreateRelationshipParamsI,
            configuration?: {
                /** throws an error if the number of created relationships don't equal to this number */
                assertCreatedRelationships?: number;
                session?: GenericConfiguration['session'];
            }
        ): Promise<number> {
            configuration = configuration || {};

            return getSession(configuration?.session, async (session) => {
                const res = await queryRunner.createRelationship(session, params);
                const relationshipsCreated = res.summary.counters.updates().relationshipsCreated;

                const { assertCreatedRelationships } = configuration;
                if (assertCreatedRelationships && relationshipsCreated !== assertCreatedRelationships) {
                    throw new NeogmaError(
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
                    throw new NeogmaNotFoundError(`A relationship with the given alias couldn't be found`, { alias });
                }

                const relationshipModel = relationship.model;

                const createRelationshipToIds = (
                    targetId: string | string[],
                    values?: CreateRelationshipParamsI['relationship']['values'],
                ) => {
                    const targetPrimaryKeyField = Model.getPrimaryKeyFieldFromRelationshipModel(relationshipModel);

                    return Model.relateTo(
                        {
                            alias: relationship.alias,
                            values,
                            where: {
                                source: {
                                    [modelPrimaryKeyField]: createdObjectId,
                                },
                                target: {
                                    [targetPrimaryKeyField]: Where.ensureIn(targetId),
                                },
                            },
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
                        throw new NeogmaConstraintError('Relationship value must be a string', {
                            description: nodeCreateConfiguration,
                            actual: targetId,
                            expected: 'string',
                        });
                    }

                    await createRelationshipToIds(targetId, nodeCreateConfiguration[relationshipCreationKeys.RelationshipValuesToCreate]);
                } else if (nodeCreateConfiguration.type === 'array of ids') {
                    /* for 'array of ids', just create the relationship with the given ids */
                    const targetIds = nodeCreateConfiguration.values;
                    /** see if it's an invalid array */
                    if (!(targetIds instanceof Array) || targetIds.find((value) => typeof value !== 'string')) {
                        throw new NeogmaConstraintError('Relationship value must be an array of strings', {
                            description: nodeCreateConfiguration,
                            actual: targetIds,
                            expected: 'string[]',
                        });
                    }

                    await createRelationshipToIds(targetIds);

                } else if (nodeCreateConfiguration.type === 'array of objects') {
                    /* for 'array of objects', create the nodes and the relationships with them */
                    const nodeCreateConfigurationValues = nodeCreateConfiguration.values;

                    if (!(nodeCreateConfigurationValues instanceof Array)) {
                        throw new NeogmaConstraintError('Relationship value must be an array of objects', {
                            description: nodeCreateConfiguration,
                            actual: nodeCreateConfigurationValues,
                            expected: 'object[]',
                        });
                    }

                    /** the primary key field of the target relationship model */
                    const targetPrimaryKeyField = Model.getPrimaryKeyFieldFromRelationshipModel(relationshipModel);

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
                        await createRelationshipToIds(withoutRelationshipValuesNodesToCreate.map((value) => value[targetPrimaryKeyField]));
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

                            await createRelationshipToIds(nodeDataToCreate[targetPrimaryKeyField], relationshipValues);
                        }
                    }

                } else if (nodeCreateConfiguration.type === 'array of id objects') {
                    const nodeCreateConfigurationValues = nodeCreateConfiguration.values;
                    if (!(nodeCreateConfigurationValues instanceof Array)) {
                        throw new NeogmaConstraintError('Relationship value must be an array of objects with id as a field', {
                            description: nodeCreateConfiguration,
                            actual: nodeCreateConfigurationValues,
                            expected: 'object[]',
                        });
                    }

                    // Bulk create those without relationship values, and single create those with relationship values
                    const bulkCreateRelationshipIds: string[] = [];
                    for (const valueToCreate of nodeCreateConfigurationValues) {
                        if (typeof valueToCreate.id !== 'string') {
                            throw new NeogmaConstraintError('Unspecified id, or not a string', {
                                description: nodeCreateConfiguration,
                                actual: valueToCreate,
                                expected: '{ id: string }',
                            });
                        }

                        if (
                            valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate]
                            && !isEmptyObject(valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate])
                        ) {
                            await createRelationshipToIds(
                                valueToCreate.id,
                                valueToCreate[relationshipCreationKeys.RelationshipValuesToCreate]
                            );
                        } else {
                            bulkCreateRelationshipIds.push(valueToCreate.id);
                        }
                    }

                    await createRelationshipToIds(bulkCreateRelationshipIds);
                } else if (nodeCreateConfiguration.type === 'where') {
                    if (!nodeCreateConfiguration.where) {
                        throw new NeogmaConstraintError('Relationship value must be WhereParamsI', {
                            description: nodeCreateConfiguration,
                            actual: nodeCreateConfiguration.where,
                            expected: 'WhereParamsI',
                        });
                    }

                    const where: Parameters<typeof Model.relateTo>[0]['where'] = {
                        source: {
                            [modelPrimaryKeyField]: createdObjectId,
                        },
                        target: nodeCreateConfiguration.where,
                    };

                    await Model.relateTo(
                        {
                            alias: relationship.alias,
                            values: nodeCreateConfiguration[relationshipCreationKeys.RelationshipValuesToCreate],
                            where,
                        }
                    );
                }

            }

        }

        /** gets the label from the given model for a relationship */
        private static getLabelFromRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? modelLabel : relationshipModel.getLabel();
        }

        /** gets the primary key field from the given model for a relationship */
        private static getPrimaryKeyFieldFromRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? modelPrimaryKeyField : relationshipModel.getPrimaryKeyField();
        }

        /** gets the model of a relationship */
        private static getRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? Model : relationshipModel;
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

    // add to modelsByName
    neogma.modelsByName[modelName] = Model;

    return Model as (typeof Model) & StaticsI;
};
