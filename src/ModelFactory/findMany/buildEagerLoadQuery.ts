import { BindParam } from '../../BindParam/BindParam';
import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { escapeIfNeeded } from '../../utils/cypher';
import { isPlainObject } from '../../utils/object';
import type { WhereParamsByIdentifierI, WhereParamsI } from '../../Where';
import { Where } from '../../Where';
import type { AnyObject } from '../shared.types';
import { PROTOTYPE_POLLUTION_KEYS } from '../validation';
import type {
  EagerLoadQueryResult,
  FindWithRelationshipsContext,
  RelationshipLevel,
  RelationshipsLoadConfig,
} from './eagerLoading.types';

/** Set of keys that should be ignored to prevent prototype pollution */
const prototypePollutionKeySet = new Set<string>(PROTOTYPE_POLLUTION_KEYS);

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

  // Validate relationships is a plain object
  if (!isPlainObject(relationships)) {
    return levels;
  }

  for (const alias of Object.keys(relationships)) {
    // Skip prototype pollution keys
    if (prototypePollutionKeySet.has(alias)) {
      continue;
    }
    const config = relationships[alias as keyof typeof relationships];
    if (!config) continue;

    // Validate config is a plain object (check without narrowing to preserve type)
    if (
      typeof config !== 'object' ||
      config === null ||
      Array.isArray(config)
    ) {
      throw new NeogmaConstraintError(
        `Invalid relationship config for '${alias}': expected an object, got ${config === null ? 'null' : Array.isArray(config) ? 'array' : typeof config}`,
      );
    }

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

  // WITH parent (escape for safe use in WITH clause)
  subqueryBuilder.with(escapeIfNeeded(parentIdentifier));

  // OPTIONAL MATCH using related pattern
  // Note: identifiers in match objects are escaped by getIdentifierWithLabel
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

  // Build filter condition for CASE WHEN (instead of WHERE to preserve parent rows)
  // WHERE after OPTIONAL MATCH can drop parent rows when no matches pass the filter.
  // By moving the condition into CASE WHEN, we ensure parents with no matching
  // relationships get an empty array instead of being dropped.
  let filterCondition = '';
  if (level.where?.target || level.where?.relationship) {
    const whereParams: WhereParamsByIdentifierI = {};
    // Only add non-empty where objects
    if (
      level.where.target &&
      typeof level.where.target === 'object' &&
      Object.keys(level.where.target).length > 0
    ) {
      whereParams[level.targetIdentifier] = level.where.target;
    }
    if (
      level.where.relationship &&
      typeof level.where.relationship === 'object' &&
      Object.keys(level.where.relationship).length > 0
    ) {
      whereParams[level.relationshipIdentifier] = level.where.relationship;
    }
    // Only generate filter condition if we have actual where params
    if (Object.keys(whereParams).length > 0) {
      const whereClause = new Where(whereParams, bindParam);
      const whereStatement = whereClause.getStatement('text');
      if (whereStatement.trim() !== '') {
        filterCondition = `AND (${whereStatement})`;
      }
    }
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

  // Escape identifiers for safe use in Cypher
  const safeTargetId = escapeIfNeeded(level.targetIdentifier);
  const safeRelId = escapeIfNeeded(level.relationshipIdentifier);
  const safeAlias = escapeIfNeeded(level.alias);

  // Build the collect fields
  const collectFields = [`node: ${safeTargetId}`, `relationship: ${safeRelId}`];

  // Add nested collections to the COLLECT
  for (const nested of level.nestedLevels) {
    const safeNestedAlias = escapeIfNeeded(nested.alias);
    collectFields.push(`${safeNestedAlias}: ${safeNestedAlias}`);
  }

  const entryExpr = `{ ${collectFields.join(', ')} }`;

  // ORDER BY must come before aggregation. Use a separate WITH if ordering is specified.
  if (level.order && level.order.length > 0) {
    // Build identifiers needed for WITH clause (includes nested aliases)
    const nestedAliases = level.nestedLevels.map((n) =>
      escapeIfNeeded(n.alias),
    );
    const withIdentifiers = [safeTargetId, safeRelId, ...nestedAliases];

    subqueryBuilder.with(withIdentifiers);

    subqueryBuilder.orderBy(
      level.order.map((o) => ({
        identifier: o.on === 'target' ? safeTargetId : safeRelId,
        property: o.property,
        direction: o.direction,
      })),
    );
  }

  // Aggregate with COLLECT. CASE returns null when target is null or doesn't match filter.
  // Filter condition is embedded in CASE WHEN to preserve parent rows with empty arrays.
  const filterPart = filterCondition ? ` ${filterCondition}` : '';
  subqueryBuilder.with(
    `COLLECT(CASE WHEN ${safeTargetId} IS NOT NULL${filterPart} THEN ${entryExpr} END) AS __collected`,
  );

  // Filter out nulls and apply skip/limit via list slicing
  let listExpr = `[x IN __collected WHERE x IS NOT NULL]`;

  // Apply skip and limit using list slicing
  const skipVal = typeof level.skip === 'number' ? level.skip : 0;
  if (typeof level.limit === 'number') {
    listExpr = `${listExpr}[${skipVal}..${skipVal + level.limit}]`;
  } else if (typeof level.skip === 'number') {
    listExpr = `${listExpr}[${skipVal}..]`;
  }

  subqueryBuilder.return(`${listExpr} AS ${safeAlias}`);

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
  if (rootSkip !== undefined) {
    queryBuilder.skip(rootSkip);
  }

  // 6. LIMIT for root using native method
  if (rootLimit !== undefined) {
    queryBuilder.limit(rootLimit);
  }

  // 7. RETURN clause (escape identifiers for safe use)
  const returnIdentifiers = [
    rootIdentifier,
    ...relationshipLevels.map((l) => l.alias),
  ];
  queryBuilder.return(returnIdentifiers.map((id) => escapeIfNeeded(id)));

  return {
    statement: queryBuilder.getStatement(),
    bindParams: bindParam.get(),
    returnIdentifiers,
    relationshipLevels,
  };
}
