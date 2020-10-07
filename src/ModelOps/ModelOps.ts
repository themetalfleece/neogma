import { int, QueryResult } from 'neo4j-driver';
import revalidator from 'revalidator';
import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import { NeogmaError } from '../Errors/NeogmaError';
import { NeogmaInstanceValidationError } from '../Errors/NeogmaInstanceValidationError';
import { NeogmaNotFoundError } from '../Errors/NeogmaNotFoundError';
import { Neogma } from '../Neogma';
import {
    CreateRelationshipParamsI,
    Neo4jSupportedTypes,
    QueryRunner,
    Runnable,
    Where,
    WhereParamsByIdentifierI,
    WhereParamsI,
    getResultProperties,
    getNodesDeleted,
} from '../QueryRunner';
import { BindParam } from '../QueryRunner/BindParam';
import clone from 'clone';

type AnyObject = Record<string, any>;

/** the type of the properties to be added to a relationship */
export type RelationshipPropertiesI = Record<string, Neo4jSupportedTypes>;

interface GenericConfiguration {
    session?: Runnable | null;
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
    /** properties for the relationship */
    RelationshipProperties extends RelationshipPropertiesI = AnyObject
> {
    /** interface of the data to create */
    CreateData: Parameters<RelatedModel['createOne']>[0] &
        Partial<RelationshipProperties>;
    /** interface of the properties of the relationship */
    RelationshipProperties: RelationshipProperties;
    Instance: RelatedInstance;
}

/** to be used in create functions where the related nodes can be passed for creation */
export type RelatedNodesCreationParamI<
    Properties,
    RelatedNodesToAssociateI extends AnyObject
> = {
    [key in keyof Partial<
        RelatedNodesToAssociateI
    >]: RelationshipTypePropertyForCreateI<
        RelatedNodesToAssociateI[key]['CreateData'],
        RelatedNodesToAssociateI[key]['RelationshipProperties']
    >;
};

/** the type to be used in RelationshipTypePropertyForCreateI.where */
type RelationshipTypePropertyForCreateWhereI<
    RelationshipProperties extends RelationshipPropertiesI
> = {
    /** where for the target nodes */
    params: WhereParamsI;
    /** whether to merge instead of create the relationship */
    merge?: boolean;
    relationshipProperties?: Partial<RelationshipProperties>;
};
/** the type of the relationship along with the properties, so the proper relationship and/or nodes can be created */
type RelationshipTypePropertyForCreateI<
    Properties,
    RelationshipProperties extends RelationshipPropertiesI
> = {
    /** create new nodes and create a relationship with them */
    properties?: Array<Properties & Partial<RelationshipProperties>>;
    /** configuration for merging instead of creating the properties/relationships */
    propertiesMergeConfig?: {
        /** merge the created nodes instead of creating them */
        nodes?: boolean;
        /** merge the relationship with the created properties instead of creating it */
        relationship?: boolean;
    };
    /** create a relationship with nodes which are matched by the where */
    where?:
        | RelationshipTypePropertyForCreateWhereI<RelationshipProperties>
        | Array<
              RelationshipTypePropertyForCreateWhereI<RelationshipProperties>
          >;
};

/** the type for the Relationship configuration of a Model */
export type RelationshipsI<RelatedNodesToAssociateI extends AnyObject> = {
    /** the alias of the relationship definitions is the key */
    [alias in keyof RelatedNodesToAssociateI]: {
        /** the related model. It could be the object of the model, or "self" for this model */
        model: NeogmaModel<any, any, any, any> | 'self';
        /** the name of the relationship */
        name: CreateRelationshipParamsI['relationship']['name'];
        /** the direction of the relationship */
        direction: 'out' | 'in' | 'none';
        /** relationship properties */
        properties?: {
            /** the alias of the relationship property is the key */
            [relationshipPropertyAlias in keyof RelatedNodesToAssociateI[alias]['RelationshipProperties']]?: {
                /** the actual property to be used on the relationship */
                property: string;
                /** validation for the property */
                schema: Revalidator.ISchema<AnyObject>;
            };
        };
    };
};

/** parameters when creating nodes */
type CreateDataParamsI = GenericConfiguration & {
    /** whether to merge instead of creating */
    merge?: boolean;
    /** validate all parent and children instances. default to true */
    validate?: boolean;
};

/** type used for creating nodes. It includes their Properties and Related Nodes */
type CreateDataI<
    Properties,
    RelatedNodesToAssociateI extends AnyObject
> = Properties &
    Partial<RelatedNodesCreationParamI<Properties, RelatedNodesToAssociateI>>;

/** the statics of a Neogma Model */
interface NeogmaModelStaticsI<
    Properties extends Record<string, Neo4jSupportedTypes>,
    RelatedNodesToAssociateI extends AnyObject = AnyObject,
    MethodsI extends AnyObject = AnyObject,
    CreateData = CreateDataI<Properties, RelatedNodesToAssociateI>,
    Instance = NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>
> {
    prototype: MethodsI;
    addRelationships: (
        relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>,
    ) => void;
    getLabel: () => string;
    getRawLabels: () => string | string[];
    getPrimaryKeyField: () => string;
    getModelName: () => string;
    __build: (
        data: CreateData,
        params: {
            status: 'new' | 'existing';
        },
    ) => Instance & Partial<RelatedNodesToAssociateI>;
    build: (data: CreateData) => Instance;
    createOne: (
        data: CreateData,
        configuration?: CreateDataParamsI,
    ) => Promise<Instance>;
    createMany: (
        data: CreateData[],
        configuration?: CreateDataParamsI,
    ) => Promise<Instance[]>;
    getRelationshipByAlias: (
        alias: keyof RelatedNodesToAssociateI,
    ) => RelationshipsI<any>[0];
    reverseRelationshipByAlias: (
        alias: keyof RelatedNodesToAssociateI,
    ) => RelationshipsI<any>[0];
    update: (
        data: Partial<Properties>,
        params?: GenericConfiguration & {
            where?: WhereParamsI;
            /** defaults to false. Whether to return the properties of the nodes after the update. If it's false, the first entry of the return value of this function will be an empty array */
            return?: boolean;
        },
    ) => Promise<[Instance[], QueryResult]>;
    updateRelationship: (
        data: AnyObject,
        params: {
            alias: keyof RelatedNodesToAssociateI;
            where?: {
                source?: WhereParamsI;
                target?: WhereParamsI;
                relationship?: WhereParamsI;
            };
            session?: GenericConfiguration['session'];
        },
    ) => Promise<QueryResult>;
    delete: (
        configuration?: GenericConfiguration & {
            detach?: boolean;
            where: WhereParamsI;
        },
    ) => Promise<number>;
    findMany: (
        params?: GenericConfiguration & {
            /** where params for the nodes of this Model */
            where?: WhereParamsI;
            limit?: number;
            order?: Array<[keyof Properties, 'ASC' | 'DESC']>;
        },
    ) => Promise<Instance[]>;
    findOne: (
        params?: GenericConfiguration & {
            /** where params for the nodes of this Model */
            where?: WhereParamsI;
            order?: Array<[keyof Properties, 'ASC' | 'DESC']>;
        },
    ) => Promise<Instance | null>;
    relateTo: <Alias extends keyof RelatedNodesToAssociateI>(params: {
        alias: Alias;
        where: {
            source: WhereParamsI;
            target: WhereParamsI;
        };
        properties?: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
        /** throws an error if the number of created relationships don't equal to this number */
        assertCreatedRelationships?: number;
        session?: GenericConfiguration['session'];
    }) => Promise<number>;
    createRelationship: (
        params: CreateRelationshipParamsI & {
            /** throws an error if the number of created relationships don't equal to this number */
            assertCreatedRelationships?: number;
        },
    ) => Promise<number>;
    getLabelFromRelationshipModel: (
        relationshipModel: NeogmaModel<any, any, any, any> | 'self',
    ) => string;
    getRelationshipModel: (
        relationshipModel: NeogmaModel<any, any, any, any> | 'self',
    ) => NeogmaModel<any, any, any, any>;
    assertPrimaryKeyField: (operation: string) => void;
}
/** the methods of a Neogma Instance */
interface NeogmaInstanceMethodsI<
    Properties,
    RelatedNodesToAssociateI extends AnyObject,
    MethodsI extends AnyObject,
    Instance = NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>
> {
    __existsInDatabase: boolean;
    dataValues: Properties;
    changed: Record<keyof Properties, boolean>;
    getDataValues: () => Properties;
    save: (configuration?: CreateDataParamsI) => Promise<Instance>;
    validate: () => Promise<void>;
    updateRelationship: (
        data: AnyObject,
        params: {
            alias: keyof RelatedNodesToAssociateI;
            where?: {
                target?: WhereParamsI;
                relationship?: WhereParamsI;
            };
            session?: GenericConfiguration['session'];
        },
    ) => Promise<QueryResult>;
    delete: (
        configuration?: GenericConfiguration & {
            detach?: boolean;
        },
    ) => Promise<number>;
    relateTo: <Alias extends keyof RelatedNodesToAssociateI>(params: {
        alias: Alias;
        where: WhereParamsI;
        properties?: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
        /** throws an error if the number of created relationships don't equal to this number */
        assertCreatedRelationships?: number;
        session?: GenericConfiguration['session'];
    }) => Promise<number>;
}

/** the type of instance of the Model */
export type NeogmaInstance<
    /** the properties used in the Model */
    Properties,
    RelatedNodesToAssociateI extends AnyObject,
    /** the Methods used in the Model */
    MethodsI extends AnyObject = AnyObject
> = Properties &
    NeogmaInstanceMethodsI<Properties, RelatedNodesToAssociateI, MethodsI> &
    MethodsI;

/** the type of a Neogma Model */
export type NeogmaModel<
    Properties extends Record<string, Neo4jSupportedTypes>,
    RelatedNodesToAssociateI extends AnyObject,
    MethodsI extends AnyObject = AnyObject,
    StaticsI extends AnyObject = AnyObject
> = NeogmaModelStaticsI<Properties, RelatedNodesToAssociateI, MethodsI> &
    StaticsI;

export type FindManyIncludeI<AliasKeys> = {
    alias: AliasKeys;
    /** where params for the nodes of the included Model */
    where?: WhereParamsI;
    /** default false */
    optional?: boolean;
    include?: FindManyIncludeI<any>;
};

/**
 * a function which returns a class with the model operation functions for the given Properties
 * RelatedNodesToAssociateI are the corresponding Nodes for Relationships
 */
export const ModelFactory = <
    /** the base Properties of the node */
    Properties extends Record<string, Neo4jSupportedTypes>,
    /** related nodes to associate. Label-ModelRelatedNodesI pairs */
    RelatedNodesToAssociateI extends AnyObject,
    /** interface for the statics of the model */
    StaticsI extends AnyObject = AnyObject,
    /** interface for the methods of the instance */
    MethodsI extends AnyObject = AnyObject
>(
    parameters: {
        /** the schema for the validation */
        schema: {
            [index in keyof Properties]:
                | Revalidator.ISchema<Properties>
                | Revalidator.JSONSchema<Properties>;
        };
        /** the label of the nodes */
        label: string | string[];
        /** statics of the Model */
        statics?: Partial<StaticsI>;
        /** method of the Instance */
        methods?: Partial<MethodsI>;
        /** the id key of this model. Is required in order to perform specific instance methods */
        primaryKeyField?: Extract<keyof Properties, string>;
        /** relationships with other models or itself. Alternatively, relationships can be added using Model.addRelationships */
        relationships?: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
    },
    neogma: Neogma,
): NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, StaticsI> => {
    const {
        label: modelLabel,
        primaryKeyField: modelPrimaryKeyField,
        schema,
    } = parameters;
    const statics = parameters.statics || {};
    const methods = parameters.methods || {};
    /* helper name for queries */
    const modelName = (modelLabel instanceof Array
        ? modelLabel
        : [modelLabel]
    ).join('');
    const schemaKeys = new Set(Object.keys(schema));

    const queryRunner = neogma.queryRunner;

    type CreateData = CreateDataI<Properties, RelatedNodesToAssociateI>;

    type InstanceMethodsI = NeogmaInstanceMethodsI<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
    >;
    type ModelStaticsI = NeogmaModelStaticsI<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
    >;
    type Instance = NeogmaInstance<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI
    >;

    const _relationships = clone(parameters.relationships);
    const Model = class ModelClass implements InstanceMethodsI {
        /** whether this instance already exists in the database or it new */
        public __existsInDatabase: InstanceMethodsI['__existsInDatabase'];

        /** the data of Properties */
        public dataValues: InstanceMethodsI['dataValues'];
        /** the changed properties of this instance, to be taken into account when saving it */
        public changed: InstanceMethodsI['changed'];

        private static relationships = _relationships;
        private static relationshipAliases: Array<
            keyof RelatedNodesToAssociateI
        > = Object.keys(_relationships || {});

        /** adds more relationship configurations to the Model (instead of using the "relationships" param on the ModelFactory constructor) */
        public static addRelationships(
            relationships: Parameters<ModelStaticsI['addRelationships']>[0],
        ): ReturnType<ModelStaticsI['addRelationships']> {
            for (const key in relationships) {
                Model.relationships[key] = relationships[key];
            }
            Model.relationshipAliases = Object.keys(Model.relationships);
        }

        /**
         * @returns {String} - the normalized label of this Model
         */
        public static getLabel(
            operation?: Parameters<typeof QueryRunner.getNormalizedLabels>[1],
        ): ReturnType<ModelStaticsI['getLabel']> {
            return QueryRunner.getNormalizedLabels(modelLabel, operation);
        }

        /**
         * @returns {String} - the label or labels of this Model as given in its definition
         */
        public static getRawLabels(): ReturnType<
            ModelStaticsI['getRawLabels']
        > {
            return modelLabel;
        }

        /**
         *
         * @returns {String} - the primary key field of this Model
         */
        public static getPrimaryKeyField(): ReturnType<
            ModelStaticsI['getPrimaryKeyField']
        > {
            return modelPrimaryKeyField;
        }

        public static getModelName(): ReturnType<
            ModelStaticsI['getModelName']
        > {
            return modelName;
        }

        public getDataValues(
            this: Instance,
        ): ReturnType<InstanceMethodsI['getDataValues']> {
            const data: Properties = Object.keys(schema).reduce(
                (acc, key: keyof Properties) => {
                    if (this[key] !== undefined) {
                        acc[key] = this[key];
                    }
                    return acc;
                },
                {} as Properties,
            );

            return data;
        }

        /**
         * validates the given instance
         * @throws NeogmaInstanceValidationError
         */
        public async validate(
            this: Instance,
        ): ReturnType<InstanceMethodsI['validate']> {
            const validationResult = revalidator.validate(
                this.getDataValues(),
                {
                    type: 'object',
                    properties: schema,
                },
            );

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
        public static __build(
            data: Parameters<ModelStaticsI['__build']>[0],
            { status }: Parameters<ModelStaticsI['__build']>[1],
        ): ReturnType<ModelStaticsI['__build']> {
            const instance = (new Model() as unknown) as Instance &
                Partial<RelatedNodesToAssociateI>;

            instance.__existsInDatabase = status === 'existing';

            instance.dataValues = {} as Properties;
            instance.changed = {} as Record<keyof Properties, boolean>;

            for (const _key of [
                ...Object.keys(schema),
                ...Object.values(Model.relationshipAliases),
            ]) {
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
        public static build(
            data: Parameters<ModelStaticsI['build']>[0],
        ): ReturnType<ModelStaticsI['build']> {
            return Model.__build(data, { status: 'new' });
        }

        /**
         * saves an instance to the database. If it's new it creates it, and if it already exists it edits it
         */
        public async save(
            _configuration?: Parameters<InstanceMethodsI['save']>[0],
        ): ReturnType<InstanceMethodsI['save']> {
            const instance = this as Instance;
            const configuration = {
                validate: true,
                ..._configuration,
            };

            if (configuration.validate) {
                await instance.validate();
            }

            if (instance.__existsInDatabase) {
                Model.assertPrimaryKeyField('updating via save');
                // if it exists in the database, update the node by only the fields which have changed
                const updateData = Object.entries(instance.changed).reduce(
                    (val, [key, changed]) => {
                        if (changed && schemaKeys.has(key)) {
                            val[key] = instance[key];
                        }
                        return val;
                    },
                    {},
                );

                await Model.update(updateData, {
                    return: false,
                    session: configuration?.session,
                    where: {
                        [modelPrimaryKeyField]: instance[modelPrimaryKeyField],
                    },
                });

                // set all changed to false
                for (const key in this.changed) {
                    if (!this.changed.hasOwnProperty(key)) {
                        continue;
                    }
                    this.changed[key] = false;
                }
                return instance;
            } else {
                // if it's a new one - it doesn't exist in the database yet, need to create it
                return Model.createOne(instance, configuration);
            }
        }

        /**
         * creates the node, also creating its children nodes and relationships
         * @param {Properties} data - the data to create, potentially including data for related nodes to be created
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Properties} - the created data
         */
        public static async createOne(
            data: Parameters<ModelStaticsI['createOne']>[0],
            configuration?: Parameters<ModelStaticsI['createOne']>[1],
        ): ReturnType<ModelStaticsI['createOne']> {
            const instances = await Model.createMany([data], configuration);
            return instances[0];
        }

        public static async createMany(
            data: Parameters<ModelStaticsI['createMany']>[0],
            configuration?: Parameters<ModelStaticsI['createMany']>[1],
        ): ReturnType<ModelStaticsI['createMany']> {
            configuration = configuration || {};
            const validate = !(configuration.validate === false);

            const createOrMerge = (merge?: boolean) =>
                merge ? 'MERGE' : 'CREATE';

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
                    relationship: RelationshipsI<any>[0];
                    /** relationship properties */
                    properties?: AnyObject;
                    /** merge the relationship instead of creating it */
                    merge?: boolean;
                }>;
            } = {};

            const instances: Instance[] = [];
            const bulkCreateData: Properties[] = [];

            const addCreateToStatement = async (
                model: NeogmaModel<any, any>,
                dataToUse: Array<CreateData | Instance>,
                /** whether to merge instead of creating the properties */
                mergeProperties?: boolean,
                parentNode?: {
                    identifier: string;
                    relationship: RelationshipsI<any>[0];
                    /** whether to merge the relationship instead of creating it */
                    mergeRelationship?: boolean;
                },
            ) => {
                for (const createData of dataToUse) {
                    /** identifier for the node to create */
                    const identifier = identifiers.getUniqueNameAndAdd(
                        'node',
                        null,
                    );
                    const label = model.getLabel();

                    const instance = (createData instanceof
                    ((model as unknown) as () => void)
                        ? createData
                        : model.__build(createData, {
                              status: 'new',
                          })) as Instance & Partial<RelatedNodesToAssociateI>;

                    instance.__existsInDatabase = true;
                    // set all changed to false as it's going to be saved
                    for (const key in instance.changed) {
                        if (!instance.changed.hasOwnProperty(key)) {
                            continue;
                        }
                        instance.changed[key] = false;
                    }

                    // push to instances only if it's the root node
                    if (!parentNode) {
                        instances.push(instance);
                    }

                    if (validate) {
                        await instance.validate();
                    }

                    const relatedNodesToAssociate: {
                        [key in keyof RelatedNodesToAssociateI]?: RelationshipTypePropertyForCreateI<
                            any,
                            any
                        >;
                    } = {};
                    for (const alias of Model.relationshipAliases) {
                        if (instance[alias]) {
                            relatedNodesToAssociate[alias] = instance[alias];
                        }
                    }

                    if (
                        relatedNodesToAssociate ||
                        parentNode ||
                        mergeProperties
                    ) {
                        /* if it has related nodes to associated or it has a parent node or it's to be merged, create it as a single node, with an identifier */

                        // CREATE or MERGE
                        statementParts.push(createOrMerge(mergeProperties));
                        // (identifier: label { where })
                        statementParts.push(
                            QueryRunner.getNodeData({
                                identifier,
                                label,
                                // use the bindParam straight away as where
                                where: QueryRunner.getPropertiesWithParams(
                                    instance.getDataValues(),
                                    bindParam,
                                ),
                            }),
                        );

                        /** returns the relationship properties to be created, from the data in dataToUse (with the alias as a key) */
                        const getRelationshipProperties = (
                            relationship: RelationshipsI<any>[0],
                            dataToUse,
                        ) => {
                            const keysToUse = Object.keys(
                                relationship.properties || {},
                            );
                            /** properties to be used in the relationship */
                            const relationshipProperties = {};
                            /** total validation for the properties */
                            const validationSchema: Record<
                                string,
                                Revalidator.ISchema<AnyObject>
                            > = {};

                            for (const key of keysToUse) {
                                const property =
                                    relationship.properties[key].property;
                                relationshipProperties[property] =
                                    dataToUse[key];
                                validationSchema[property] =
                                    relationship.properties[key].schema;
                            }

                            const validationResult = revalidator.validate(
                                relationshipProperties,
                                {
                                    type: 'object',
                                    properties: validationSchema,
                                },
                            );

                            if (validationResult.errors.length) {
                                throw new NeogmaInstanceValidationError(
                                    `Could not validate relationship property`,
                                    {
                                        model: Model,
                                        errors: validationResult.errors,
                                    },
                                );
                            }
                            return relationshipProperties;
                        };

                        /** if it has a parent node, also create a relationship with it */
                        if (parentNode) {
                            const {
                                relationship,
                                identifier: parentIdentifier,
                            } = parentNode;

                            const relationshipProperties = getRelationshipProperties(
                                relationship,
                                createData,
                            );

                            /* set an identifier only if we need to create relationship properties */
                            const relationshipIdentifier =
                                relationshipProperties &&
                                identifiers.getUniqueNameAndAdd('r', null);

                            // CREATE or MERGE
                            statementParts.push(
                                createOrMerge(parentNode.mergeRelationship),
                            );
                            // (parentIdentifier)
                            statementParts.push(
                                QueryRunner.getNodeData({
                                    identifier: parentIdentifier,
                                }),
                            );
                            // -[relationship]-
                            statementParts.push(
                                QueryRunner.getRelationshipDirectionAndName({
                                    direction: relationship.direction,
                                    name: relationship.name,
                                    identifier: relationshipIdentifier,
                                }),
                            );
                            // (identifier)
                            statementParts.push(
                                QueryRunner.getNodeData({
                                    identifier,
                                }),
                            );

                            if (
                                relationshipProperties &&
                                Object.keys(relationshipProperties).length > 0
                            ) {
                                /* create the relationship properties */
                                const relationshipPropertiesParam = bindParam.getUniqueNameAndAdd(
                                    'relationshipProperty',
                                    relationshipProperties,
                                );
                                statementParts.push(`
                                    SET ${relationshipIdentifier} += $${relationshipPropertiesParam}
                                `);
                            }
                        }

                        /** create the related nodes */
                        for (const relationshipAlias in relatedNodesToAssociate) {
                            if (
                                !relatedNodesToAssociate.hasOwnProperty(
                                    relationshipAlias,
                                )
                            ) {
                                continue;
                            }

                            const relatedNodesData: RelationshipTypePropertyForCreateI<
                                any,
                                any
                            > = relatedNodesToAssociate[relationshipAlias];
                            const relationship = model.getRelationshipByAlias(
                                relationshipAlias,
                            );
                            const otherModel = model.getRelationshipModel(
                                relationship.model,
                            ) as ModelStaticsI;

                            if (relatedNodesData.properties) {
                                await addCreateToStatement(
                                    otherModel,
                                    relatedNodesData.properties,
                                    relatedNodesData.propertiesMergeConfig
                                        ?.nodes,
                                    {
                                        identifier,
                                        relationship,
                                        mergeRelationship:
                                            relatedNodesData
                                                .propertiesMergeConfig
                                                ?.relationship,
                                    },
                                );
                            }
                            if (relatedNodesData.where) {
                                const whereArr =
                                    relatedNodesData.where instanceof Array
                                        ? relatedNodesData.where
                                        : [relatedNodesData.where];

                                for (const whereEntry of whereArr) {
                                    if (!toRelateByIdentifier[identifier]) {
                                        toRelateByIdentifier[identifier] = [];
                                    }

                                    const relationshipProperties = getRelationshipProperties(
                                        relationship,
                                        whereEntry.relationshipProperties,
                                    );

                                    toRelateByIdentifier[identifier].push({
                                        relationship,
                                        where: whereEntry.params,
                                        properties: relationshipProperties,
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
                const bulkCreateIdentifier = identifiers.getUniqueNameAndAdd(
                    'bulkCreateNodes',
                    null,
                );
                const bulkCreateOptionsParam = bindParam.getUniqueNameAndAdd(
                    'bulkCreateOptions',
                    bulkCreateData,
                );
                const bulkCreateDataIdentifier = identifiers.getUniqueNameAndAdd(
                    'bulkCreateData',
                    null,
                );
                statementParts.unshift(`
                    UNWIND $${bulkCreateOptionsParam} as ${bulkCreateDataIdentifier}
                `);
                statementParts.push(`
                    CREATE ${QueryRunner.getNodeData({
                        identifier: bulkCreateIdentifier,
                        label: this.getLabel(),
                    })}
                `);
                statementParts.push(
                    `SET ${bulkCreateIdentifier} += ${bulkCreateDataIdentifier}`,
                );
            }

            // parse toRelateByIdentifier
            const relationshipByWhereParts = [];
            for (const identifier of Object.keys(toRelateByIdentifier)) {
                /** to be used in the WITH clause */
                const allNeededIdentifiers = Object.keys(toRelateByIdentifier);
                for (const relateParameters of toRelateByIdentifier[
                    identifier
                ]) {
                    const relationship = relateParameters.relationship;
                    const relationshipIdentifier = identifiers.getUniqueNameAndAdd(
                        'r',
                        null,
                    );
                    const targetNodeModel = Model.getRelationshipModel(
                        relationship.model,
                    );
                    const targetNodeLabel = targetNodeModel.getLabel();
                    const targetNodeIdentifier = identifiers.getUniqueNameAndAdd(
                        'targetNode',
                        null,
                    );

                    relationshipByWhereParts.push(
                        `WITH DISTINCT ${allNeededIdentifiers.join(', ')}`,
                        `MATCH ${QueryRunner.getNodeData({
                            identifier: targetNodeIdentifier,
                            label: targetNodeLabel,
                        })}`,
                        `WHERE ${new Where(
                            {
                                [targetNodeIdentifier]: relateParameters.where,
                            },
                            bindParam,
                        ).getStatement('text')}`,
                        // CREATE or MERGE
                        createOrMerge(relateParameters.merge),
                        // (identifier)
                        QueryRunner.getNodeData({ identifier }),
                        // -[relationship]-
                        QueryRunner.getRelationshipDirectionAndName({
                            direction: relationship.direction,
                            name: relationship.name,
                            identifier: relationshipIdentifier,
                        }),
                        // (targetNodeIdentifier)
                        QueryRunner.getNodeData({
                            identifier: targetNodeIdentifier,
                        }),
                    );
                    if (
                        relateParameters.properties &&
                        Object.keys(relateParameters.properties).length > 0
                    ) {
                        /* create the relationship properties */
                        const relationshipPropertiesParam = bindParam.getUniqueNameAndAdd(
                            'relationshipProperty',
                            relateParameters.properties,
                        );
                        relationshipByWhereParts.push(`
                            SET ${relationshipIdentifier} += $${relationshipPropertiesParam}
                        `);
                    }

                    // remove this relateParameters from the array
                    toRelateByIdentifier[identifier] = toRelateByIdentifier[
                        identifier
                    ].filter((r) => r !== relateParameters);
                }
                // remove the identifier from the object
                delete toRelateByIdentifier[identifier];
            }

            statementParts.push(...relationshipByWhereParts);

            const statement = statementParts.join(' ');
            const queryParams = bindParam.get();

            await queryRunner.run(
                statement,
                queryParams,
                configuration?.session,
            );

            return instances;
        }

        public static getRelationshipByAlias = (
            alias: Parameters<ModelStaticsI['getRelationshipByAlias']>[0],
        ): ReturnType<ModelStaticsI['getRelationshipByAlias']> => {
            if (!Model.relationships) {
                throw new NeogmaNotFoundError(
                    `Relationship definitions can't be found for the model ${modelName}`,
                );
            }

            const relationship = Model.relationships[alias];

            if (!relationship) {
                throw new NeogmaNotFoundError(
                    `The relationship of the alias ${alias} can't be found for the model ${modelName}`,
                );
            }

            return {
                model: relationship.model,
                direction: relationship.direction,
                name: relationship.name,
                properties: relationship.properties,
            };
        };

        /**
         * reverses the configuration of a relationship, so it can be easily duplicated when defining another Model.
         */
        public static reverseRelationshipByAlias = (
            alias: Parameters<ModelStaticsI['reverseRelationshipByAlias']>[0],
        ): ReturnType<ModelStaticsI['reverseRelationshipByAlias']> => {
            const relationship = Model.getRelationshipByAlias(alias);

            const reverseDirection = (
                d: typeof relationship['direction'],
            ): typeof relationship['direction'] => {
                if (d === 'in') {
                    return 'out';
                }
                if (d === 'out') {
                    return 'in';
                }
                return 'none';
            };

            return {
                model: Model,
                direction: reverseDirection(relationship.direction),
                name: relationship.name,
                properties: relationship.properties,
            };
        };

        public static async update(
            data: Parameters<ModelStaticsI['update']>[0],
            params?: Parameters<ModelStaticsI['update']>[1],
        ): ReturnType<ModelStaticsI['update']> {
            const label = Model.getLabel();
            const identifier = 'node';

            const where = params?.where
                ? {
                      [identifier]: params.where,
                  }
                : null;

            const res = await queryRunner.update({
                label,
                data,
                where,
                identifier,
                return: params.return,
                session: params?.session,
            });
            const nodeProperties = params?.return
                ? getResultProperties<Properties>(res, identifier)
                : [];

            const instances = nodeProperties.map((v) =>
                Model.__build(
                    (v as unknown) as CreateDataI<
                        Properties,
                        RelatedNodesToAssociateI
                    >,
                    { status: 'existing' },
                ),
            );
            return [instances, res] as [Instance[], QueryResult];
        }

        public static async updateRelationship(
            data: Parameters<ModelStaticsI['updateRelationship']>[0],
            params: Parameters<ModelStaticsI['updateRelationship']>[1],
        ): ReturnType<ModelStaticsI['updateRelationship']> {
            const relationship = Model.getRelationshipByAlias(params.alias);

            const identifiers = {
                source: 'source',
                target: 'target',
                relationship: 'r',
            };
            const labels = {
                source: Model.getLabel(),
                target: relationship.model.getLabel(),
            };

            const where: Where = new Where({});
            if (params.where?.source) {
                where.addParams({ [identifiers.source]: params.where.source });
            }
            if (params.where?.target) {
                where.addParams({ [identifiers.target]: params.where.target });
            }
            if (params.where?.relationship) {
                where.addParams({
                    [identifiers.relationship]: params.where.relationship,
                });
            }

            const { getNodeData } = QueryRunner;

            /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
            const updateBindParam = where.getBindParam().clone();

            const { statement: setStatement } = QueryRunner.getSetParts({
                bindParam: updateBindParam,
                data,
                identifier: identifiers.relationship,
            });

            const statementParts: string[] = [];

            statementParts.push('MATCH');
            // (identifier: label)
            statementParts.push(
                getNodeData({
                    identifier: identifiers.source,
                    label: labels.source,
                }),
            );
            // -[relationship]-
            statementParts.push(
                QueryRunner.getRelationshipDirectionAndName({
                    direction: relationship.direction,
                    name: relationship.name,
                    identifier: identifiers.relationship,
                }),
            );
            // (identifier: label)
            statementParts.push(
                getNodeData({
                    identifier: identifiers.target,
                    label: labels.target,
                }),
            );

            const whereStatement = where.getStatement('text');
            if (whereStatement) {
                statementParts.push(`WHERE ${whereStatement}`);
            }

            statementParts.push(setStatement);

            return queryRunner.run(
                statementParts.join(' '),
                updateBindParam.get(),
                params?.session,
            );
        }

        public async updateRelationship(
            data: Parameters<InstanceMethodsI['updateRelationship']>[0],
            params: Parameters<InstanceMethodsI['updateRelationship']>[1],
        ): ReturnType<InstanceMethodsI['updateRelationship']> {
            Model.assertPrimaryKeyField('updateRelationship');
            return Model.updateRelationship(data, {
                ...params,
                where: {
                    ...params.where,
                    source: {
                        [modelPrimaryKeyField]: this[
                            modelPrimaryKeyField as string
                        ],
                    },
                },
            });
        }

        public static async delete(
            configuration?: Parameters<ModelStaticsI['delete']>[0],
        ): ReturnType<ModelStaticsI['delete']> {
            const { detach, where } = configuration;
            const label = Model.getLabel();

            const identifier = 'node';
            const res = await queryRunner.delete({
                label,
                where: {
                    [identifier]: where,
                },
                detach,
                identifier,
                session: configuration?.session,
            });
            return getNodesDeleted(res);
        }

        public async delete(
            configuration?: Parameters<InstanceMethodsI['delete']>[0],
        ): ReturnType<InstanceMethodsI['delete']> {
            Model.assertPrimaryKeyField('delete');

            return Model.delete({
                ...configuration,
                where: {
                    [modelPrimaryKeyField]: this[
                        modelPrimaryKeyField as string
                    ],
                },
            });
        }

        public static async findMany(
            params?: Parameters<ModelStaticsI['findMany']>[0],
        ): ReturnType<ModelStaticsI['findMany']> {
            const label = this.getLabel();

            const rootIdentifier = modelName;

            const bindParam = new BindParam();
            const rootWhere =
                params?.where &&
                new Where(
                    {
                        [rootIdentifier]: params?.where,
                    },
                    bindParam,
                );

            const statementParts: string[] = [];

            /* match the nodes of this Model */
            statementParts.push(`
                MATCH (${rootIdentifier}:${label})
            `);
            if (rootWhere) {
                statementParts.push(`
                    WHERE ${rootWhere.getStatement('text')}
                `);
            }
            /* add the return statement */
            statementParts.push(`
                RETURN ${rootIdentifier}
            `);

            if (params?.order) {
                statementParts.push(`
                    ORDER BY ${params?.order
                        .filter(([field]) => schemaKeys.has(field as string))
                        .map(
                            ([field, direction]) =>
                                `${rootIdentifier}.${field} ${direction}`,
                        )
                        .join(', ')}
                `);
            }

            if (params?.limit) {
                const limitParam = bindParam.getUniqueNameAndAdd(
                    'limit',
                    int(params?.limit),
                );
                statementParts.push(`LIMIT $${limitParam}`);
            }

            const statement = statementParts.join(' ');
            const res = await queryRunner.run(
                statement,
                bindParam.get(),
                params?.session,
            );

            const instances = res.records.map((record) => {
                const node = record.get(rootIdentifier);
                const data: Properties = node.properties;
                const instance = Model.__build(
                    (data as unknown) as CreateDataI<
                        Properties,
                        RelatedNodesToAssociateI
                    >,
                    { status: 'existing' },
                );
                instance.__existsInDatabase = true;
                return instance;
            });

            return instances;
        }

        public static async findOne(
            params?: Parameters<ModelStaticsI['findOne']>[0],
        ): ReturnType<ModelStaticsI['findOne']> {
            const instances = await Model.findMany({
                ...params,
                limit: 1,
            });
            return instances?.[0] || null;
        }

        /** creates a relationship by using the configuration specified in "relationships" from the given alias */
        public static async relateTo(
            params: Parameters<ModelStaticsI['relateTo']>[0],
        ): ReturnType<ModelStaticsI['relateTo']> {
            const relationship = Model.getRelationshipByAlias(
                params.alias as keyof RelatedNodesToAssociateI,
            );

            const where: WhereParamsByIdentifierI = {};
            if (params.where) {
                where[QueryRunner.identifiers.createRelationship.source] =
                    params.where.source;
                where[QueryRunner.identifiers.createRelationship.target] =
                    params.where.target;
            }

            const res = await queryRunner.createRelationship({
                source: {
                    label: this.getLabel(),
                },
                target: {
                    label: relationship.model.getLabel(),
                },
                relationship: {
                    name: relationship.name,
                    direction: relationship.direction,
                    properties: params.properties,
                },
                where,
                session: params.session,
            });
            const relationshipsCreated = res.summary.counters.updates()
                .relationshipsCreated;

            const { assertCreatedRelationships } = params;
            if (
                assertCreatedRelationships &&
                relationshipsCreated !== assertCreatedRelationships
            ) {
                throw new NeogmaError(
                    `Not all required relationships were created`,
                    {
                        relationshipsCreated,
                        ...params,
                    },
                );
            }

            return relationshipsCreated;
        }

        /** wrapper for the static relateTo, where the source is always this node */
        public async relateTo(
            params: Parameters<InstanceMethodsI['relateTo']>[0],
        ): ReturnType<InstanceMethodsI['relateTo']> {
            Model.assertPrimaryKeyField('relateTo');

            return Model.relateTo({
                ...params,
                where: {
                    source: {
                        [modelPrimaryKeyField]: this[
                            modelPrimaryKeyField as string
                        ],
                    },
                    target: params.where,
                },
            });
        }

        /**
         * @param {queryRunner.CreateRelationshipParamsI} - the parameters including the 2 nodes and the label/direction of the relationship between them
         * @param {GenericConfiguration} configuration - query configuration
         * @returns {Number} - the number of created relationships
         */
        public static async createRelationship(
            params: Parameters<ModelStaticsI['createRelationship']>[0],
        ): ReturnType<ModelStaticsI['createRelationship']> {
            const res = await queryRunner.createRelationship(params);
            const relationshipsCreated = res.summary.counters.updates()
                .relationshipsCreated;

            const { assertCreatedRelationships } = params;
            if (
                assertCreatedRelationships &&
                relationshipsCreated !== assertCreatedRelationships
            ) {
                throw new NeogmaError(
                    `Not all required relationships were created`,
                    {
                        relationshipsCreated,
                        ...params,
                    },
                );
            }

            return relationshipsCreated;
        }

        /** gets the label from the given model for a relationship */
        public static getLabelFromRelationshipModel(
            relationshipModel: Parameters<
                ModelStaticsI['getLabelFromRelationshipModel']
            >[0],
        ): ReturnType<ModelStaticsI['getLabelFromRelationshipModel']> {
            return relationshipModel === 'self'
                ? Model.getLabel()
                : relationshipModel.getLabel();
        }

        /** gets the model of a relationship */
        public static getRelationshipModel(
            relationshipModel: Parameters<
                ModelStaticsI['getRelationshipModel']
            >[0],
        ): ReturnType<ModelStaticsI['getRelationshipModel']> {
            return relationshipModel === 'self' ? Model : relationshipModel;
        }

        public static assertPrimaryKeyField(
            operation: Parameters<ModelStaticsI['assertPrimaryKeyField']>[0],
        ): ReturnType<ModelStaticsI['assertPrimaryKeyField']> {
            if (!modelPrimaryKeyField) {
                throw new NeogmaConstraintError(
                    `This operation (${operation}) required the model to have a primaryKeyField`,
                );
            }
        }
    };

    for (const staticKey in statics) {
        if (!statics.hasOwnProperty(staticKey)) {
            continue;
        }
        Model[staticKey as keyof typeof Model] = statics[staticKey];
    }

    for (const methodKey in methods) {
        if (!methods.hasOwnProperty(methodKey)) {
            continue;
        }
        Model.prototype[methodKey as keyof typeof Model.prototype] =
            methods[methodKey];
    }

    // add to modelsByName
    neogma.modelsByName[modelName] = Model;

    return (Model as unknown) as NeogmaModel<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        StaticsI
    >;
};
