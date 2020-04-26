import { QueryResult, Session } from 'neo4j-driver';
import * as revalidator from 'revalidator';
import { NeogmaConstraintError } from '../errors/NeogmaConstraintError';
import { NeogmaError } from '../errors/NeogmaError';
import { NeogmaInstanceValidationError } from '../errors/NeogmaInstanceValidationError';
import { NeogmaNotFoundError } from '../errors/NeogmaNotFoundError';
import { Neogma } from '../Neogma';
import { BindParam, CreateRelationshipParamsI, Neo4jSupportedTypes, QueryRunner, Where, WhereParamsByIdentifierI, WhereParamsI, WhereValuesI } from '../QueryRunner';

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

/** the type to be used in RelationshipTypeValueForCreateI.where */
type RelationshipTypeValueForCreateWhereI<
    RelationshipValuesToCreateKey extends string,
    Attributes extends {
        [key in RelationshipValuesToCreateKey]?: RelationshipValuesI;
    }
    > = {
        /** where for the target nodes */
        params: WhereParamsI;
        /** whether to merge instead of create the relationship */
        merge?: boolean;
    } & {
        [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
    };
/** the type of the relationship along with the values, so the proper relationship and/or nodes can be created */
type RelationshipTypeValueForCreateI
    <
    RelationshipValuesToCreateKey extends string,
    Attributes extends {
        [key in RelationshipValuesToCreateKey]?: RelationshipValuesI;
    }
    > = {
        /** create new nodes and create a relationshi[] with them */
        attributes?: Array<Attributes & {
            [key in RelationshipValuesToCreateKey]?: Attributes[RelationshipValuesToCreateKey];
        }>;
        /** configuration for merging instead of creating the attributes/relationships */
        attributesMergeConfig?: {
            /** merge the created attributes instead of creating them */
            attibutes?: boolean;
            /** merge the relationship with the created attributes instead of creating it */
            relationship?: boolean;
        }
        /** create a relationship with nodes which are matched by the where */
        where?: RelationshipTypeValueForCreateWhereI<RelationshipValuesToCreateKey, Attributes> |
        Array<RelationshipTypeValueForCreateWhereI<RelationshipValuesToCreateKey, Attributes>>;
    };

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
    /** the string which will be used as a key for Relationship Values creation */
    RelationshipValuesToCreateKey extends string,
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
        [key in RelatedNodesToAssociateKey]?: RelatedNodesCreationParamI<RelationshipValuesToCreateKey, RelatedNodesToAssociateI>;
    };
    /** parameters when creating nodes */
    type CreateDataParamsI = GenericConfiguration & {
        /** whether to merge instead of creating */
        merge?: boolean;
        /** validate all parent and children instances. default to true */
        validate?: boolean;
    };

    const { label: modelLabel, primaryKeyField: modelPrimaryKeyField, relationshipCreationKeys, schema } = parameters;
    const statics = parameters.statics || {};
    const methods = parameters.methods || {};
    const relationships = parameters.relationships || [];
    /* helper name for queries */
    const modelName = (modelLabel instanceof Array ? modelLabel : [modelLabel]).join('');
    const schemaKeys = new Set(Object.keys(schema));

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
         * validates the given instance
         * @throws NeogmaInstanceValidationError
         */
        public async validate() {
            const validationResult = revalidator.validate(this.getDataValues(), {
                type: 'object',
                properties: schema,
            });

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
        public save(_configuration?: CreateDataParamsI): Promise<Instance> {
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
                        if (changed && schemaKeys.has(key)) {
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
                    return Model.createOne(instance, {
                        ...configuration,
                        session,
                    });
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
            data: Parameters<typeof Model['createMany']>[0][0],
            configuration?: Parameters<typeof Model['createMany']>[1],
        ): Promise<Instance> {
            const instances = await Model.createMany([data], configuration);
            return instances[0];
        }

        public static async createMany(
            data: CreateDataI[] | Instance[],
            configuration?: CreateDataParamsI,
        ): Promise<Instance[]> {
            configuration = configuration || {};
            const validate = !(configuration.validate === false);

            const createOrMerge = (merge?: boolean) => merge ? 'MERGE' : 'CREATE';

            return getSession(configuration?.session, async (session) => {

                const statementParts: string[] = [];

                /** the bind param of the query */
                const bindParam = new BindParam();
                // used only for unique names
                const identifiers = new BindParam();

                /** identifiers and the where/relationship configuration for a relationship to be created */
                const toRelateByIdentifier: {
                    [identifier: string]: Array<{
                        /** the where params to use */
                        where: WhereParamsI;
                        /** relatinship information */
                        relationship: Omit<RelationshipsI<any>[0], 'alias'>;
                        /** relationship attributes */
                        values?: object;
                        /** merge the relationship instead of creating it */
                        merge?: boolean;
                    }>;
                } = {};

                const instances: Instance[] = [];
                const bulkCreateData: Attributes[] = [];

                const addCreateToStatement = async <M extends NeogmaModel>(
                    model: M,
                    dataToUse: object[],
                    /** whether to merge instead of creating the attributes */
                    mergeAttributes?: boolean,
                    parentNode?: {
                        identifier: string;
                        relationship: Omit<RelationshipsI<any>[0], 'alias'>;
                        relationshipValuesToCreateKey?: string;
                        /** whether to merge the relationship instead of creating it */
                        mergeRelationship?: boolean;
                    }
                ) => {
                    for (const createData of dataToUse) {
                        /** identifier for the node to create */
                        const identifier = identifiers.getUniqueNameAndAdd('node', null);
                        const label = QueryRunner.getNormalizedLabels(model.getLabel());

                        const instance = (
                            createData instanceof model ? createData : model.__build(createData, { status: 'new' })
                        ) as Instance;
                        instance.__existsInDatabase = true;
                        // set all changed to false as it's going to be saved
                        for (const key in instance.changed) {
                            if (!instance.changed.hasOwnProperty(key)) { continue; }
                            instance.changed[key] = false;
                        }

                        instances.push(instance);

                        if (validate) {
                            await instance.validate();
                        }

                        const relatedNodesToAssociate = instance[model.getRelationshipCreationKeys().RelatedNodesToAssociate];
                        if (relatedNodesToAssociate || parentNode) {
                            /* if it has related nodes to associated or it has a parent node, create it with an identifier */
                            const dataParam = bindParam.getUniqueNameAndAdd('data', instance.getDataValues());

                            const identifierWithLabel = QueryRunner.getIdentifierWithLabel(identifier, label);

                            statementParts.push(`
                                ${createOrMerge(mergeAttributes)} (${identifierWithLabel}) SET ${identifier} += {${dataParam}}
                            `);

                            /** if it has a parent node, also create a relationship with it */
                            if (parentNode) {
                                const { relationship, identifier: parentIdentifier } = parentNode;
                                const relationshipValues = instance[parentNode.relationshipValuesToCreateKey];

                                /* set an identifier only if we need to create relationship values */
                                const relationshipIdentifier = relationshipValues && identifiers.getUniqueNameAndAdd('r', null);
                                const directionAndNameString = QueryRunner.getRelationshipDirectionAndName({
                                    direction: relationship.direction,
                                    name: relationship.name,
                                    identifier: relationshipIdentifier,
                                });
                                statementParts.push(`
                                    ${createOrMerge(parentNode.mergeRelationship)} (${parentIdentifier})${directionAndNameString}(${identifier})
                                `);
                                if (relationshipValues) {
                                    /* create the relationship values */
                                    const relationshipValuesParam = bindParam.getUniqueNameAndAdd('relationshipValue', relationshipValues);
                                    statementParts.push(`
                                        SET ${relationshipIdentifier} += {${relationshipValuesParam}}
                                    `);
                                }
                            }

                            /** create the related nodes */
                            for (const relationshipAlias in relatedNodesToAssociate) {
                                if (!relatedNodesToAssociate.hasOwnProperty(relationshipAlias)) { continue; }

                                const relatedNodesData: RelationshipTypeValueForCreateI<any, any> = relatedNodesToAssociate[relationshipAlias];
                                const relationship = model.getRelationshipByAlias(relationshipAlias);
                                const otherModel = model.getRelationshipModel(relationship.model) as NeogmaModel;

                                if (relatedNodesData.attributes) {
                                    await addCreateToStatement(
                                        otherModel,
                                        relatedNodesData.attributes,
                                        relatedNodesData.attributesMergeConfig?.attibutes,
                                        {
                                            identifier,
                                            relationship,
                                            // use the RelationshipValuesToCreate key of this model
                                            relationshipValuesToCreateKey: model.getRelationshipCreationKeys().RelationshipValuesToCreate,
                                            mergeRelationship: relatedNodesData.attributesMergeConfig?.relationship,
                                        }
                                    );
                                }
                                if (relatedNodesData.where) {
                                    const whereArr = relatedNodesData.where instanceof Array ? relatedNodesData.where : [relatedNodesData.where];

                                    for (const whereEntry of whereArr) {
                                        if (!toRelateByIdentifier[identifier]) {
                                            toRelateByIdentifier[identifier] = [];
                                        }

                                        // add the info to toRelateByIdentifier
                                        toRelateByIdentifier[identifier].push({
                                            relationship,
                                            where: whereEntry.params,
                                            values: whereEntry[model.getRelationshipCreationKeys().RelationshipValuesToCreate],
                                            merge: whereEntry.merge,
                                        });
                                    }
                                }
                            }
                        } else {
                            /* if it doesn't have related nodes to associated and it doesn't have a parent node add it to the array so they'll be bulk created */
                            bulkCreateData.push(instance.getDataValues());
                        }
                    }
                };

                await addCreateToStatement(Model, data, configuration?.merge, null);

                // parse data to bulk create
                if (bulkCreateData.length) {
                    const bulkCreateIdentifier = identifiers.getUniqueNameAndAdd('bulkCreateNodes', null);
                    const bulkCreateOptionsParam = bindParam.getUniqueNameAndAdd('bulkCreateOptions', bulkCreateData);
                    const bulkCreateDataIdentifier = identifiers.getUniqueNameAndAdd('bulkCreateData', null);
                    statementParts.unshift(`
                        UNWIND {${bulkCreateOptionsParam}} as ${bulkCreateDataIdentifier}
                    `);
                    statementParts.push(`
                        ${createOrMerge(configuration?.merge)} (${QueryRunner.getIdentifierWithLabel(bulkCreateIdentifier, QueryRunner.getNormalizedLabels(modelLabel))})
                        SET ${bulkCreateIdentifier} += ${bulkCreateDataIdentifier}
                    `);
                }

                // parse toRelateByIdentifier
                const relationshipByWhereParts = [];
                for (const identifier of Object.keys(toRelateByIdentifier)) {
                    /** to be used in the WITH clause */
                    const allNeededIdentifiers = Object.keys(toRelateByIdentifier);
                    for (const relateParameters of toRelateByIdentifier[identifier]) {
                        const relationship = relateParameters.relationship;
                        const relationshipIdentifier = identifiers.getUniqueNameAndAdd('r', null);
                        const targetNodeModel = Model.getRelationshipModel(relationship.model);
                        const targetNodeLabel = QueryRunner.getNormalizedLabels(targetNodeModel.getLabel());
                        const targetNodeIdentifier = identifiers.getUniqueNameAndAdd('targetNode', null);

                        relationshipByWhereParts.push(
                            `WITH DISTINCT ${allNeededIdentifiers.join(', ')}`,
                            `MATCH (${QueryRunner.getIdentifierWithLabel(targetNodeIdentifier, targetNodeLabel)})`,
                            `WHERE ${new Where({ [targetNodeIdentifier]: relateParameters.where }, bindParam).statement}`,
                            `${createOrMerge(relateParameters.merge)} (${identifier})${QueryRunner.getRelationshipDirectionAndName({
                                direction: relationship.direction,
                                name: relationship.name,
                                identifier: relationshipIdentifier,
                            })}(${targetNodeIdentifier})`
                        );
                        if (relateParameters.values) {
                            /* create the relationship values */
                            const relationshipValuesParam = bindParam.getUniqueNameAndAdd('relationshipValue', relateParameters.values);
                            relationshipByWhereParts.push(`
                                SET ${relationshipIdentifier} += {${relationshipValuesParam}}
                            `);
                        }

                        // remove this relateParameters from the array
                        toRelateByIdentifier[identifier] = toRelateByIdentifier[identifier].filter((r) => r !== relateParameters);
                    }
                    // remove the identifier from the object
                    delete toRelateByIdentifier[identifier];
                }

                statementParts.push(...relationshipByWhereParts);

                const statement = statementParts.join(' ');
                const queryParams = bindParam.get();

                await queryRunner.run(session, statement, queryParams);

                return instances;
            });
        }

        public static getRelationshipByAlias = (alias: keyof RelatedNodesToAssociateI) => {
            const relationship = relationships.find((r) => r.alias === alias);

            if (!alias) {
                throw new NeogmaNotFoundError(`The relationship of the alias ${alias} can't be found for the model ${modelLabel}`);
            }

            return {
                model: relationship.model,
                direction: relationship.direction,
                name: relationship.name,
            };
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
                    [modelPrimaryKeyField]: { $in: ids },
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

        /** gets the label from the given model for a relationship */
        private static getLabelFromRelationshipModel(relationshipModel: typeof relationships[0]['model']) {
            return relationshipModel === 'self' ? modelLabel : relationshipModel.getLabel();
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
