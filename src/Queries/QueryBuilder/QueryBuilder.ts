import { QueryRunner } from '../..';
import { NeogmaConstraintError } from '../../Errors';
import { int } from 'neo4j-driver';
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
import { replaceWhitespace } from '../../utils/string';
import { BindParam } from 'Queries/BindParam';
import { Where } from 'Queries/Where';

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
    /** parameters for the query to be generated */
    private parameters: ParameterI[];
    /** the statement for the query */
    private statement: string;
    /** the bind parameters for the query */
    private bindParam: BindParam;

    constructor(
        /** parameters for the query */
        parameters: QueryBuilder['parameters'],
        config?: {
            /** an existing bindParam to be used */
            bindParam?: BindParam;
        },
    ) {
        this.parameters = parameters;

        this.bindParam = config?.bindParam || new BindParam({});

        this.setStatementByParameters();
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
    private setStatementByParameters() {
        const statementParts: string[] = [];

        for (const param of this.parameters) {
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

        // join the statement parts and trim all whitespace
        this.statement = replaceWhitespace(statementParts.join('\n'));
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
            typeof QueryRunner.getNodeStatement
        >[0] = {
            identifier: node.identifier,
            label,
        };

        if (isNodeWithWhere(node)) {
            getNodeStatementParams.inner = new Where(
                {
                    [node.identifier]: node.where,
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
        return QueryRunner.getNodeStatement(getNodeStatementParams);
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
            typeof QueryRunner.getRelationshipStatement
        >[0] = {
            direction,
            identifier: relationship.identifier,
            name,
        };

        if (isRelationshipWithWhere(relationship)) {
            getRelationshipStatementParams.inner = new Where(
                {
                    [identifier]: relationship.where,
                },
                this.bindParam,
            );
        } else if (isRelationshipWithProperties(relationship)) {
            getRelationshipStatementParams.inner = {
                properties: relationship.properties,
                bindParam: this.getBindParam(),
            };
        }

        return QueryRunner.getRelationshipStatement(
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
                }),
            ].join(' ');
        }
        if (isNodeWithModel(create)) {
            return [
                createOrMerge,
                this.getNodeString({
                    identifier: create.identifier,
                    model: create.model,
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

        return QueryRunner.getSetParts({
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
            return `WHERE ${where.getStatement('text')}`;
        }

        // else, where object
        const whereInstance = new Where(where, this.bindParam);
        return `WHERE ${whereInstance.getStatement('text')}`;
    }
}