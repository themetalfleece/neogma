import { getRunnable } from '../../Sessions';
import { NeogmaConstraintError, NeogmaError } from '../../Errors';
import { int } from 'neo4j-driver';
import { QueryResult } from 'neo4j-driver/types';
import { trimWhitespace } from '../../utils/string';
import { BindParam } from '../BindParam';
import { Where } from '../Where';
import {
    QueryRunner,
    Runnable,
    Neo4jSupportedProperties,
} from '../QueryRunner';
import {
    ParameterI,
    isRawParameter,
    isMatchParameter,
    isCreateParameter,
    isMergeParameter,
    isSetParameter,
    isDeleteParameter,
    isRemoveParameter,
    isReturnParameter,
    isLimitParameter,
    isWithParameter,
    NodeForMatchI,
    NodeForCreateI,
    isNodeWithLabel,
    isNodeWithModel,
    isNodeWithWhere,
    isNodeWithProperties,
    RelationshipForMatchI,
    RelationshipForCreateI,
    isRelationshipWithWhere,
    isRelationshipWithProperties,
    MatchI,
    RawI,
    isMatchMultiple,
    isMatchRelated,
    isRelationship,
    isMatchLiteral,
    CreateI,
    isCreateMultiple,
    isCreateRelated,
    SetI,
    DeleteI,
    isDeleteWithIdentifier,
    isDeleteWithLiteral,
    RemoveI,
    isRemoveProperties,
    isRemoveLabels,
    ReturnI,
    isReturnObject,
    LimitI,
    WithI,
    MergeI,
    UnwindI,
    OrderByI,
    ForEachI,
    SkipI,
    WhereI,
    isSkipParameter,
    isUnwindParameter,
    isForEachParameter,
    isOrderByParameter,
    isWhereParameter,
} from './QueryBuilder.types';

type AnyObject = Record<string, any>;

export type QueryBuilderParameters = {
    ParameterI: ParameterI;
    RawI: RawI['raw'];
    MatchI: MatchI['match'];
    CreateI: CreateI['create'];
    MergeI: MergeI['merge'];
    SetI: SetI['set'];
    DeleteI: DeleteI['delete'];
    RemoveI: RemoveI['remove'];
    ReturnI: ReturnI['return'];
    LimitI: LimitI['limit'];
    WithI: WithI['with'];
    OrderByI: OrderByI['orderBy'];
    UnwindI: UnwindI['unwind'];
    ForEachI: ForEachI['forEach'];
    SkipI: SkipI['skip'];
    WhereI: WhereI['where'];
};

export class QueryBuilder {
    /** a queryRunner instance can be set to always be used at the 'run' method */
    public static queryRunner: QueryRunner;

    /** parameters for the query to be generated */
    private parameters: ParameterI[] = [];
    /** the statement for the query */
    private statement = '';
    /** the bind parameters for the query */
    private bindParam: BindParam;

    constructor(
        /** an existing bindParam to be used */
        bindParam?: BindParam,
    ) {
        this.bindParam = BindParam.acquire(bindParam);
    }

    public addParams(
        /** parameters for the query */
        parameters: ParameterI | ParameterI[],
        ...restParameters: ParameterI[]
    ): QueryBuilder {
        const allParameters = Array.isArray(parameters)
            ? parameters
            : [parameters];

        if (restParameters) {
            allParameters.push(...restParameters);
        }

        this.parameters.push(...allParameters);
        this.setStatementByParameters(allParameters);

        return this;
    }

    /** get the generated statement for the query */
    public getStatement(): QueryBuilder['statement'] {
        return this.statement;
    }

    /** get the bind parameter for the query */
    public getBindParam(): QueryBuilder['bindParam'] {
        return this.bindParam;
    }

    /** generates the statement by using the parameters and the bindParam */
    private setStatementByParameters(parameters: QueryBuilder['parameters']) {
        const statementParts: string[] = [];

        for (const param of parameters) {
            if (param === null || param === undefined) {
                continue;
            }

            if (isRawParameter(param)) {
                statementParts.push(param.raw);
            } else if (isMatchParameter(param)) {
                statementParts.push(this.getMatchString(param.match));
            } else if (isCreateParameter(param)) {
                statementParts.push(
                    this.getCreateOrMergeString(param.create, 'create'),
                );
            } else if (isMergeParameter(param)) {
                statementParts.push(
                    this.getCreateOrMergeString(param.merge, 'merge'),
                );
            } else if (isSetParameter(param)) {
                statementParts.push(this.getSetString(param.set));
            } else if (isDeleteParameter(param)) {
                statementParts.push(this.getDeleteString(param.delete));
            } else if (isRemoveParameter(param)) {
                statementParts.push(this.getRemoveString(param.remove));
            } else if (isReturnParameter(param)) {
                statementParts.push(this.getReturnString(param.return));
            } else if (isLimitParameter(param)) {
                statementParts.push(this.getLimitString(param.limit));
            } else if (isWithParameter(param)) {
                statementParts.push(this.getWithString(param.with));
            } else if (isSkipParameter(param)) {
                statementParts.push(this.getSkipString(param.skip));
            } else if (isUnwindParameter(param)) {
                statementParts.push(this.getUnwindString(param.unwind));
            } else if (isForEachParameter(param)) {
                statementParts.push(this.getForEachString(param.forEach));
            } else if (isOrderByParameter(param)) {
                statementParts.push(this.getOrderByString(param.orderBy));
            } else if (isWhereParameter(param)) {
                statementParts.push(this.getWhereString(param.where));
            }
        }

        // join the statement parts and trim all whitespace. Append them to the existing statement
        this.statement = trimWhitespace(
            this.statement + ' ' + statementParts.join('\n'),
        );
    }

    private getNodeString(node: NodeForMatchI | NodeForCreateI): string {
        if (typeof node === 'string') {
            return node;
        }

        // else, it's a NodeObjectI
        let label = '';
        if (isNodeWithLabel(node)) {
            label = node.label;
        } else if (isNodeWithModel(node)) {
            label = node.model.getLabel();
        }

        const getNodeStatementParams: Parameters<
            typeof QueryBuilder.getNodeStatement
        >[0] = {
            identifier: node.identifier,
            label,
        };

        if (isNodeWithWhere(node)) {
            getNodeStatementParams.inner = new Where(
                {
                    [node.identifier || '']: node.where,
                },
                this.bindParam,
            );
        } else if (isNodeWithProperties(node)) {
            getNodeStatementParams.inner = {
                properties: node.properties,
                bindParam: this.getBindParam(),
            };
        }

        // (identifier: label { where })
        return QueryBuilder.getNodeStatement(getNodeStatementParams);
    }

    private getRelationshipString(
        relationship: RelationshipForMatchI | RelationshipForCreateI,
    ): string {
        if (typeof relationship === 'string') {
            return relationship;
        }

        // else, it's a relationship object
        const { direction, identifier, name } = relationship;

        const getRelationshipStatementParams: Parameters<
            typeof QueryBuilder.getRelationshipStatement
        >[0] = {
            direction,
            identifier: relationship.identifier,
            name,
        };

        if (isRelationshipWithWhere(relationship)) {
            getRelationshipStatementParams.inner = new Where(
                {
                    [identifier || '']: relationship.where,
                },
                this.bindParam,
            );
        } else if (isRelationshipWithProperties(relationship)) {
            getRelationshipStatementParams.inner = {
                properties: relationship.properties,
                bindParam: this.getBindParam(),
            };
        }

        return QueryBuilder.getRelationshipStatement(
            getRelationshipStatementParams,
        );
    }

    /** returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
    private getMatchString(match: MatchI['match']): string {
        if (typeof match === 'string') {
            return `MATCH ${match}`;
        }

        if (isMatchMultiple(match)) {
            return [
                match.optional ? 'OPTIONAL' : '',
                'MATCH',
                match.multiple
                    .map((element) => this.getNodeString(element))
                    .join(', '),
            ].join(' ');
        }

        if (isMatchRelated(match)) {
            // every even element is a node, every odd element is a relationship
            const parts: string[] = [];

            for (let index = 0; index < match.related.length; index++) {
                const element = match.related[index];
                if (index % 2) {
                    // even, parse as relationship
                    if (!isRelationship(element)) {
                        throw new NeogmaConstraintError(
                            'even argument of related is not a relationship',
                        );
                    }
                    parts.push(this.getRelationshipString(element));
                } else {
                    // odd, parse as node
                    parts.push(this.getNodeString(element));
                }
            }

            return [
                match.optional ? 'OPTIONAL' : '',
                'MATCH',
                parts.join(''),
            ].join(' ');
        }

        if (isMatchLiteral(match)) {
            return [
                match.optional ? 'OPTIONAL' : '',
                `MATCH ${this.getNodeString(match.literal)}`,
            ].join(' ');
        }

        // else, is a node
        return [
            match.optional ? 'OPTIONAL' : '',
            `MATCH ${this.getNodeString(match)}`,
        ].join(' ');
    }

    private getCreateOrMergeString(
        create: CreateI['create'],
        mode: 'create' | 'merge',
    ): string {
        const createOrMerge = mode === 'merge' ? 'MERGE' : 'CREATE';

        if (typeof create === 'string') {
            return `${createOrMerge} ${create}`;
        }

        if (isCreateMultiple(create)) {
            return [
                createOrMerge,
                create.multiple
                    .map((element) => this.getNodeString(element))
                    .join(', '),
            ].join(' ');
        }

        if (isCreateRelated(create)) {
            // every even element is a node, every odd element is a relationship
            const parts: string[] = [];

            for (let index = 0; index < create.related.length; index++) {
                const element = create.related[index];
                if (index % 2) {
                    // even, parse as relationship
                    if (!isRelationship(element)) {
                        throw new NeogmaConstraintError(
                            'even argument of related is not a relationship',
                        );
                    }
                    parts.push(this.getRelationshipString(element));
                } else {
                    // odd, parse as node
                    parts.push(this.getNodeString(element));
                }
            }

            return [createOrMerge, parts.join('')].join(' ');
        }

        // else, is a node
        if (isNodeWithLabel(create)) {
            return [
                createOrMerge,
                this.getNodeString({
                    identifier: create.identifier,
                    label: create.label,
                    properties: create.properties,
                }),
            ].join(' ');
        }
        if (isNodeWithModel(create)) {
            return [
                createOrMerge,
                this.getNodeString({
                    identifier: create.identifier,
                    model: create.model,
                    properties: create.properties,
                }),
            ].join(' ');
        }

        throw new NeogmaConstraintError('Invanid create parameter', {
            actual: create,
        });
    }

    /** returns a string in the format: `SET a.p1 = $v1, a.p2 = $v2` */
    private getSetString(set: SetI['set']): string {
        if (typeof set === 'string') {
            return `SET ${set}`;
        }

        return QueryBuilder.getSetParts({
            data: set.properties,
            identifier: set.identifier,
            bindParam: this.bindParam,
        }).statement;
    }

    private getDeleteString(dlt: DeleteI['delete']): string {
        if (typeof dlt === 'string') {
            return `DELETE ${dlt}`;
        }

        if (isDeleteWithIdentifier(dlt)) {
            const identifiers = Array.isArray(dlt.identifiers)
                ? dlt.identifiers
                : [dlt.identifiers];

            return `${dlt.detach ? 'DETACH ' : ''}DELETE ${identifiers.join(
                ', ',
            )}`;
        }

        if (isDeleteWithLiteral(dlt)) {
            return `${dlt.detach ? 'DETACH ' : ''}DELETE ${dlt.literal}`;
        }

        throw new NeogmaConstraintError('invalid delete configuration');
    }

    private getRemoveString(remove: RemoveI['remove']): string {
        if (typeof remove === 'string') {
            return `REMOVE ${remove}`;
        }

        if (isRemoveProperties(remove)) {
            const properties = Array.isArray(remove.properties)
                ? remove.properties
                : [remove.properties];
            const propertiesWithIdentifier = properties.map(
                (p) => `${remove.identifier}.${p}`,
            );
            return `REMOVE ${propertiesWithIdentifier.join(', ')}`;
        }

        if (isRemoveLabels(remove)) {
            const labels = Array.isArray(remove.labels)
                ? remove.labels
                : [remove.labels];
            return `REMOVE ${remove.identifier}:${labels.join(':')}`;
        }

        throw new NeogmaConstraintError('invalid remove configuration');
    }

    private getReturnString(rtn: ReturnI['return']): string {
        if (typeof rtn === 'string') {
            return `RETURN ${rtn}`;
        }

        if (isReturnObject(rtn)) {
            const returnString = rtn
                .map(
                    (v) =>
                        `${v.identifier}${v.property ? '.' + v.property : ''}`,
                )
                .join(', ');

            return `RETURN ${returnString}`;
        }

        // else string array
        return `RETURN ${rtn.join(', ')}`;
    }

    private getLimitString(limit: LimitI['limit']): string {
        const limitString =
            typeof limit === 'string'
                ? limit
                : `$${this.bindParam.getUniqueNameAndAdd('limit', int(limit))}`;

        return `LIMIT ${limitString}`;
    }

    private getSkipString(skip: SkipI['skip']): string {
        const skipString =
            typeof skip === 'string'
                ? skip
                : `$${this.bindParam.getUniqueNameAndAdd('skip', int(skip))}`;

        return `SKIP ${skipString}`;
    }

    private getWithString(wth: WithI['with']): string {
        const wthArr = Array.isArray(wth) ? wth : [wth];

        return `WITH ${wthArr.join(', ')}`;
    }

    private getUnwindString(unwind: UnwindI['unwind']): string {
        const unwindString =
            typeof unwind === 'string'
                ? unwind
                : `${unwind.value} AS ${unwind.as}`;

        return `UNWIND ${unwindString}`;
    }

    private getForEachString(forEach: ForEachI['forEach']): string {
        return `FOR EACH ${forEach}`;
    }

    private getOrderByString(orderBy: OrderByI['orderBy']): string {
        if (typeof orderBy === 'string') {
            return `ORDER BY ${orderBy}`;
        }

        if (Array.isArray(orderBy)) {
            const orderByParts = orderBy.map((element) => {
                if (typeof element === 'string') {
                    return element;
                }
                if (Array.isArray(element)) {
                    return `${element[0]} ${element[1]}`;
                }
                return [
                    // identifier.property
                    [element.identifier, element.property]
                        .filter((v) => v)
                        .join('.'),
                    // ASC or DESC
                    element.direction,
                ]
                    .filter((v) => v)
                    .join(' ');
            });

            return `ORDER BY ${orderByParts.join(', ')}`;
        }

        // else, it's the object type
        const orderByString = [
            // identifier.property
            [orderBy.identifier, orderBy.property].filter((v) => v).join('.'),
            // ASC or DESC
            orderBy.direction,
        ]
            .filter((v) => v)
            .join(' ');

        return `ORDER BY ${orderByString}`;
    }

    private getWhereString(where: WhereI['where']): string {
        if (typeof where === 'string') {
            return `WHERE ${where}`;
        }

        if (where instanceof Where) {
            const statement = where.getStatement('text');
            if (!statement) {
                return '';
            }
            return `WHERE ${statement}`;
        }

        // else, where object
        const whereInstance = new Where(where, this.bindParam);
        const statement = whereInstance.getStatement('text');
        if (!statement) {
            return '';
        }
        return `WHERE ${statement}`;
    }

    /**
     * surrounds the label with backticks to also allow spaces
     * @param label - the label to use
     * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
     */
    public static getNormalizedLabels = (
        label: string | string[],
        operation?: 'and' | 'or',
    ): string => {
        const labels = label instanceof Array ? label : [label];
        return labels
            .map((l) => '`' + l + '`')
            .join(operation === 'or' ? '|' : ':');
    };

    /**
     * returns a string to be used in a query, regardless if any of the identifier or label are null
     */
    public static getIdentifierWithLabel = (
        identifier?: string,
        label?: string,
    ): string => {
        return `${identifier ? identifier : ''}${label ? ':' + label : ''}`;
    };

    /**
     * returns the appropriate string for a node, ready to be put in a statement
     * example: (ident: Label { a.p1: $v1 })
     */
    public static getNodeStatement = ({
        identifier,
        label,
        inner,
    }: {
        /** identifier for the node */
        identifier?: string;
        /** identifier for the label */
        label?: string;
        /** a statement to be used inside the node, like a where condition or properties */
        inner?:
            | string
            | Where
            | {
                  properties: Neo4jSupportedProperties;
                  bindParam: BindParam;
              };
    }): string => {
        const nodeParts: string[] = [];

        if (identifier || label) {
            nodeParts.push(
                QueryBuilder.getIdentifierWithLabel(identifier, label),
            );
        }

        if (inner) {
            if (typeof inner === 'string') {
                nodeParts.push(inner);
            } else if (inner instanceof Where) {
                nodeParts.push(inner.getStatement('object'));
            } else {
                nodeParts.push(
                    QueryBuilder.getPropertiesWithParams(
                        inner.properties,
                        inner.bindParam,
                    ),
                );
            }
        }

        return `(${nodeParts.join(' ')})`;
    };

    /**
     * returns the appropriate string for a relationship, ready to be put in a statement
     * example: -[identifier: name {where}]->
     */
    public static getRelationshipStatement = (params: {
        /** relationship direction */
        direction: 'in' | 'out' | 'none';
        /** relationship name */
        name?: string;
        /** relationship identifier. If empty, no identifier will be used */
        identifier?: string;
        /** a statement to be used inside the relationship, like a where condition or properties */
        inner?:
            | string
            | Where
            | {
                  properties: Neo4jSupportedProperties;
                  bindParam: BindParam;
              };
    }): string => {
        const { direction, name, inner } = params;
        const identifier = params.identifier || '';

        const allParts: string[] = [];

        // <- or -
        allParts.push(direction === 'in' ? '<-' : '-');

        // strings will be inside [ ]
        const innerRelationshipParts: string[] = [];
        // identifier:Name
        if (identifier || name) {
            innerRelationshipParts.push(
                QueryBuilder.getIdentifierWithLabel(identifier, name),
            );
        }
        if (inner) {
            if (typeof inner === 'string') {
                innerRelationshipParts.push(inner);
            } else if (inner instanceof Where) {
                innerRelationshipParts.push(inner.getStatement('object'));
            } else {
                innerRelationshipParts.push(
                    QueryBuilder.getPropertiesWithParams(
                        inner.properties,
                        inner.bindParam,
                    ),
                );
            }
        }

        // wrap it in [ ]
        allParts.push(`[${innerRelationshipParts.join(' ')}]`);

        // -> or -
        allParts.push(direction === 'out' ? '->' : '-');

        return allParts.join('');
    };

    /** returns the parts and the statement for a SET operation with the given params */
    public static getSetParts = (params: {
        /** data to set */
        data: AnyObject;
        /** bind param to use */
        bindParam: BindParam;
        /** identifier to use */
        identifier: string;
    }): {
        parts: string[];
        statement: string;
    } => {
        const { data, bindParam, identifier } = params;

        const setParts: string[] = [];
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            const paramKey = bindParam.getUniqueNameAndAdd(key, data[key]);
            setParts.push(`${identifier}.${key} = $${paramKey}`);
        }

        if (!setParts.length) {
            return {
                parts: [],
                statement: '',
            };
        }

        return {
            parts: setParts,
            statement: `SET ${setParts.join(', ')}`,
        };
    };

    /**
     * returns an object with replacing its values with a bind param value
     * example return value: ( a.p1 = $v1, b.p2 = $v2 )
     */
    public static getPropertiesWithParams = (
        /** data to set */
        data: AnyObject,
        /** bind param to use and mutate */
        bindParam: BindParam,
    ): string => {
        const parts: string[] = [];

        for (const key of Object.keys(data)) {
            parts.push(
                `${key}: $${bindParam.getUniqueNameAndAdd(key, data[key])}`,
            );
        }

        return `{ ${parts.join(', ')} }`;
    };

    /** runs this instance with the given QueryRunner instance */
    public async run(
        /** the QueryRunner instance to use */
        queryRunnerOrRunnable?: QueryRunner | Runnable | null,
        /** an existing session to use. Set it only if the first param is a QueryRunner instance */
        existingSession?: Runnable | null,
    ): Promise<QueryResult> {
        const queryRunner =
            queryRunnerOrRunnable instanceof QueryRunner
                ? queryRunnerOrRunnable
                : QueryBuilder.queryRunner;
        if (!queryRunner) {
            throw new NeogmaError(
                'A queryRunner was not given to run this builder. Make sure that the first parameter is a QueryRunner instance, or that QueryBuilder.queryRunner is set',
            );
        }

        const sessionToGet =
            queryRunnerOrRunnable &&
            !(queryRunnerOrRunnable instanceof QueryRunner)
                ? queryRunnerOrRunnable
                : existingSession;

        return getRunnable(
            sessionToGet,
            async (session) => {
                return queryRunner.run(
                    this.getStatement(),
                    this.getBindParam().get(),
                    session,
                );
            },
            queryRunner.getDriver(),
        );
    }

    /** a literal statement to use as is */
    public raw(raw: RawI['raw']): QueryBuilder {
        return this.addParams({ raw });
    }
    /** MATCH statement */
    public match(match: MatchI['match']): QueryBuilder {
        return this.addParams({ match });
    }
    /** CREATE statement */
    public create(create: CreateI['create']): QueryBuilder {
        return this.addParams({ create });
    }
    /** MERGE statement */
    public merge(merge: MergeI['merge']): QueryBuilder {
        return this.addParams({ merge });
    }
    /** SET statement */
    public set(set: SetI['set']): QueryBuilder {
        return this.addParams({ set });
    }
    /** DELETE statement */
    public delete(deleteParam: DeleteI['delete']): QueryBuilder {
        return this.addParams({ delete: deleteParam });
    }
    /** REMOVE statement */
    public remove(remove: RemoveI['remove']): QueryBuilder {
        return this.addParams({ remove });
    }
    /** RETURN statement */
    public return(returnParam: ReturnI['return']): QueryBuilder {
        return this.addParams({ return: returnParam });
    }
    /** LIMIT statement */
    public limit(limit: LimitI['limit']): QueryBuilder {
        return this.addParams({ limit });
    }
    /** WITH statement */
    public with(withParam: WithI['with']): QueryBuilder {
        return this.addParams({ with: withParam });
    }
    /** ORDER BY statement */
    public orderBy(orderBy: OrderByI['orderBy']): QueryBuilder {
        return this.addParams({ orderBy });
    }
    /** UNWIND statement */
    public unwind(unwind: UnwindI['unwind']): QueryBuilder {
        return this.addParams({ unwind });
    }
    /** FOR EACH statement */
    public forEach(forEach: ForEachI['forEach']): QueryBuilder {
        return this.addParams({ forEach });
    }
    /** SKIP statement */
    public skip(skip: SkipI['skip']): QueryBuilder {
        return this.addParams({ skip });
    }
    /** WHERE statement */
    public where(where: WhereI['where']): QueryBuilder {
        return this.addParams({ where });
    }
}
