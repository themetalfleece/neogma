import { BindParam } from '../../BindParam/BindParam';
import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { WhereParamsByIdentifierI } from '../../Where';
import type { AnyObject } from '../shared.types';
import type {
  EagerLoadQueryResult,
  FindWithRelationshipsContext,
  RelationshipLevel,
  RelationshipsLoadConfig,
} from './eagerLoading.types';

/**
 * Parameters for building the eager load query.
 */
interface BuildEagerLoadQueryParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  rootLabel: string;
  rootIdentifier: string;
  rootWhere?: WhereParamsI<Properties>;
  rootOrder?: Array<[string, 'ASC' | 'DESC']>;
  rootLimit?: number;
  rootSkip?: number;
  /** Set of valid schema keys for filtering order properties */
  schemaKeys: Set<string>;
  relationships: RelationshipsLoadConfig<RelatedNodesToAssociateI>;
  ctx: FindWithRelationshipsContext<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;
}

/**
 * Parses the relationship configuration into internal RelationshipLevel[] structure.
 */
function parseRelationshipConfig<
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  relationships: RelationshipsLoadConfig<RelatedNodesToAssociateI>,
  ctx: FindWithRelationshipsContext<any, RelatedNodesToAssociateI, MethodsI>,
  depth: number,
): RelationshipLevel[] {
  const levels: RelationshipLevel[] = [];

  for (const alias of Object.keys(relationships)) {
    const config = relationships[alias as keyof typeof relationships];
    if (!config) continue;

    const relInfo = ctx.getRelationshipByAlias(
      alias as keyof RelatedNodesToAssociateI,
    );
    const targetModel = ctx.getRelationshipModel(relInfo.model);

    const targetIdentifier = `target_${depth}_${alias}`;
    const relationshipIdentifier = `rel_${depth}_${alias}`;

    const level: RelationshipLevel = {
      alias,
      relationshipName: relInfo.name,
      direction: relInfo.direction,
      targetLabel: targetModel.getLabel(),
      targetIdentifier,
      relationshipIdentifier,
      where: config.where,
      order: config.order,
      limit: config.limit,
      skip: config.skip,
      nestedLevels: [],
      targetModel,
    };

    // Recursively process nested relationships
    if (config.relationships && Object.keys(config.relationships).length > 0) {
      const nestedCtx: FindWithRelationshipsContext<any, any, any> = {
        ...ctx,
        getRelationshipByAlias: targetModel.getRelationshipByAlias.bind(
          targetModel,
        ) as typeof ctx.getRelationshipByAlias,
        getRelationshipModel: targetModel.getRelationshipModel.bind(
          targetModel,
        ) as typeof ctx.getRelationshipModel,
        buildFromRecord: targetModel.buildFromRecord.bind(targetModel),
        getLabel: targetModel.getLabel.bind(targetModel),
      };

      level.nestedLevels = parseRelationshipConfig(
        config.relationships as RelationshipsLoadConfig<any>,
        nestedCtx,
        depth + 1,
      );
    }

    levels.push(level);
  }

  return levels;
}

/**
 * Builds a CALL subquery for a single relationship level using QueryBuilder.
 *
 * The query structure:
 * 1. OPTIONAL MATCH to get related nodes (may return nulls)
 * 2. WHERE clause for filtering
 * 3. Handle nested CALL subqueries for nested relationships
 * 4. WITH + ORDER BY (before aggregation, if ordering specified)
 * 5. WITH COLLECT(...) to aggregate results
 * 6. Filter nulls and apply skip/limit via list slicing
 *
 * This ensures root nodes with no relationships return an empty array
 * instead of being dropped from results.
 */
function buildRelationshipSubquery(
  level: RelationshipLevel,
  bindParam: BindParam,
  parentIdentifier: string,
): QueryBuilder {
  const subqueryBuilder = new QueryBuilder(bindParam);

  // WITH parent
  subqueryBuilder.with(parentIdentifier);

  // OPTIONAL MATCH using related pattern
  subqueryBuilder.match({
    related: [
      { identifier: parentIdentifier },
      {
        direction: level.direction,
        name: level.relationshipName,
        identifier: level.relationshipIdentifier,
      },
      {
        identifier: level.targetIdentifier,
        label: level.targetLabel,
      },
    ],
    optional: true,
  });

  // WHERE clause for target and relationship using object format
  if (level.where?.target || level.where?.relationship) {
    const whereParams: WhereParamsByIdentifierI = {};
    if (level.where.target) {
      whereParams[level.targetIdentifier] = level.where.target;
    }
    if (level.where.relationship) {
      whereParams[level.relationshipIdentifier] = level.where.relationship;
    }
    subqueryBuilder.where(whereParams);
  }

  // Handle nested relationships recursively BEFORE aggregation
  for (const nested of level.nestedLevels) {
    const nestedSubquery = buildRelationshipSubquery(
      nested,
      bindParam,
      level.targetIdentifier,
    );
    subqueryBuilder.call(nestedSubquery);
  }

  // Build the collect fields
  const collectFields = [
    `node: ${level.targetIdentifier}`,
    `relationship: ${level.relationshipIdentifier}`,
  ];

  // Add nested collections to the COLLECT
  for (const nested of level.nestedLevels) {
    collectFields.push(`${nested.alias}: ${nested.alias}`);
  }

  const entryExpr = `{ ${collectFields.join(', ')} }`;

  // ORDER BY must come before aggregation. Use a separate WITH if ordering is specified.
  if (level.order && level.order.length > 0) {
    // Build identifiers needed for WITH clause (includes nested aliases)
    const nestedAliases = level.nestedLevels.map((n) => n.alias);
    const withIdentifiers = [
      level.targetIdentifier,
      level.relationshipIdentifier,
      ...nestedAliases,
    ];

    subqueryBuilder.with(withIdentifiers);

    subqueryBuilder.orderBy(
      level.order.map((o) => ({
        identifier:
          o.on === 'target'
            ? level.targetIdentifier
            : level.relationshipIdentifier,
        property: o.property,
        direction: o.direction,
      })),
    );
  }

  // Aggregate with COLLECT. CASE returns null when target is null (OPTIONAL MATCH with no match).
  subqueryBuilder.with(
    `COLLECT(CASE WHEN ${level.targetIdentifier} IS NOT NULL THEN ${entryExpr} END) AS __collected`,
  );

  // Filter out nulls and apply skip/limit via list slicing
  let listExpr = `[x IN __collected WHERE x IS NOT NULL]`;

  // Apply skip and limit using list slicing
  if (level.skip || level.limit) {
    const skipVal = level.skip || 0;
    if (level.limit) {
      listExpr = `${listExpr}[${skipVal}..${skipVal + level.limit}]`;
    } else {
      listExpr = `${listExpr}[${skipVal}..]`;
    }
  }

  subqueryBuilder.return(`${listExpr} AS ${level.alias}`);

  return subqueryBuilder;
}

/**
 * Builds the Cypher query for eager loading relationships.
 * Uses QueryBuilder with CALL subqueries and COLLECT for nested aggregation.
 */
export function buildEagerLoadQuery<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  params: BuildEagerLoadQueryParams<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >,
): EagerLoadQueryResult {
  const bindParam = new BindParam();
  const {
    rootLabel,
    rootIdentifier,
    rootWhere,
    rootOrder,
    rootLimit,
    rootSkip,
    schemaKeys,
    relationships,
    ctx,
  } = params;

  // Parse relationship config into internal structure
  const relationshipLevels = parseRelationshipConfig(
    relationships,
    ctx,
    0, // depth
  );

  // Build the main query using QueryBuilder
  const queryBuilder = new QueryBuilder(bindParam);

  // 1. Root MATCH
  queryBuilder.match({
    identifier: rootIdentifier,
    label: rootLabel,
  });

  // 2. Root WHERE using object format
  if (rootWhere) {
    queryBuilder.where({ [rootIdentifier]: rootWhere });
  }

  // 3. Build CALL subqueries for each relationship
  for (const level of relationshipLevels) {
    const subquery = buildRelationshipSubquery(
      level,
      bindParam,
      rootIdentifier,
    );
    queryBuilder.call(subquery);
  }

  // 4. ORDER BY for root using object format (filter by schema keys like findManyStandard)
  if (rootOrder && rootOrder.length > 0) {
    const filteredOrder = rootOrder.filter(([field]) => schemaKeys.has(field));
    if (filteredOrder.length > 0) {
      queryBuilder.orderBy(
        filteredOrder.map(([prop, dir]) => ({
          identifier: rootIdentifier,
          property: prop,
          direction: dir,
        })),
      );
    }
  }

  // 5. SKIP for root using native method
  if (rootSkip) {
    queryBuilder.skip(rootSkip);
  }

  // 6. LIMIT for root using native method
  if (rootLimit) {
    queryBuilder.limit(rootLimit);
  }

  // 7. RETURN clause
  const returnIdentifiers = [
    rootIdentifier,
    ...relationshipLevels.map((l) => l.alias),
  ];
  queryBuilder.return(returnIdentifiers);

  return {
    statement: queryBuilder.getStatement(),
    bindParams: bindParam.get(),
    returnIdentifiers,
    relationshipLevels,
  };
}
