import Type from 'typebox';

import { NeogmaModelSchemaError } from '../Errors';
import {
  ModelFactory,
  type NeogmaModel,
  type RelationshipsI,
} from '../ModelFactory';
import type { AnyObject, PropertySchema } from '../ModelFactory/shared.types';
import type { Neogma } from '../Neogma';
import type { Neo4jSupportedProperties } from '../QueryRunner';
import type {
  AsNeo4jProperties,
  InferMethods,
  InferProperties,
  InferRelatedNodes,
  InferStatics,
} from './inference';
import {
  getMetadata,
  NEOGMA_NODE_KEY,
  NEOGMA_PRIMARY_KEY_FIELD,
  NEOGMA_PROPERTIES_KEY,
  NEOGMA_RELATIONSHIPS_KEY,
  type NodeMetadata,
  normalizeRelationshipProperties,
  type PropertyMetadata,
  readClassMetadataStore,
  type RelationshipMetadata,
} from './metadata';
import type {
  ModelRegistry,
  NodeEntityClass,
  UntypedNeogmaModel,
} from './types';

/** Shape of a single relationship config entry built from decorator metadata. */
interface RelationshipConfig {
  model: UntypedNeogmaModel | 'self';
  direction: 'in' | 'out' | 'none';
  name: string;
  properties?: Record<string, { property: string; schema: PropertySchema }>;
}

// Internal registry: decorated class -> NeogmaModel
const modelRegistry: ModelRegistry = new Map();

/**
 * Pending relationship-resolution queue keyed by target class.
 *
 * When `toModel(A)` runs before its target class `B` has been converted, the
 * relationship-entry-to-be-patched is queued here. As soon as `toModel(B)`
 * completes and registers B, we flush this queue and patch every waiting
 * relationship's `.model` field in place — the ModelFactory-built classes
 * expose `.relationships` as a mutable static, so overwriting the placeholder
 * after the fact is safe and takes effect before any query runs.
 *
 * This is what lets users declare `toModel(A)` and `toModel(B)` in either
 * order when A and B point at each other.
 */
const pendingRelationshipResolutions: Map<
  NodeEntityClass,
  Array<{ ownerModel: UntypedNeogmaModel; alias: string }>
> = new Map();

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Reads a metadata field from the WeakMap store (preferred) or falls
 * back to Symbol.metadata. Centralizes the repeated ternary pattern.
 * @internal
 */
function readField<T>(
  wmStore: ReturnType<typeof readClassMetadataStore>,
  classMetadata: object,
  wmKey: symbol,
  fallbackDefault?: T,
): T | undefined {
  if (wmStore) {
    return (
      ((wmStore as Record<symbol, unknown>)[wmKey] as T) ?? fallbackDefault
    );
  }
  return (
    getMetadata<T>(classMetadata as DecoratorMetadataObject, wmKey) ??
    fallbackDefault
  );
}

/**
 * Extracts own static methods from a class constructor.
 * Filters out built-in keys (`prototype`, `length`, `name`) and
 * non-function members.
 * @internal
 */
function extractStaticMethods(
  target: NodeEntityClass,
): Record<string, unknown> {
  const record = target as unknown as Record<string, unknown>;
  const statics: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(target)) {
    if (
      key !== 'prototype' &&
      key !== 'length' &&
      key !== 'name' &&
      typeof record[key] === 'function'
    ) {
      statics[key] = record[key];
    }
  }
  return statics;
}

/**
 * Extracts own instance methods from a class prototype.
 * Filters out `constructor` and non-function members.
 * @internal
 */
function extractInstanceMethods(
  target: NodeEntityClass,
): Record<string, unknown> {
  const proto = target.prototype as Record<string, unknown>;
  const methods: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(target.prototype)) {
    if (key !== 'constructor' && typeof proto[key] === 'function') {
      methods[key] = proto[key];
    }
  }
  return methods;
}

/**
 * Clears the decorator → NeogmaModel registry maintained by `toModel()`.
 *
 * Exposed primarily for test suites that rebuild models between runs (a
 * fresh `neogma` instance + fresh registry avoids cross-test pollution).
 * Application code should not need to call this; the registry is a
 * one-shot lookup table built up as `toModel()` is called.
 *
 * @internal
 */
export function clearModelRegistry(): void {
  modelRegistry.clear();
  pendingRelationshipResolutions.clear();
}

/**
 * Converts a decorated class into a NeogmaModel by:
 * 1. Reading metadata from @Node, @Property, @Relationship decorators
 * 2. Forwarding TypeBox schemas (or `Type.Any()` placeholders for properties
 *    declared without a schema) into ModelFactory
 * 3. Building relationship configurations with their TypeBox schemas attached
 * 4. Extracting statics from the class
 * 5. Extracting instance methods from the prototype
 * 6. Calling ModelFactory with all assembled config
 * 7. Registering the resulting model in the class → NeogmaModel registry
 * 8. Queueing this call's deferred relationship targets — entries whose
 *    `.model` field is still a placeholder because the target class had not
 *    yet been converted at the time relationships were built in step 3
 * 9. Flushing any pending resolutions that were waiting on THIS class —
 *    earlier `toModel()` calls that pointed at it before it was built get
 *    their placeholder `.model` field patched in place with the freshly-built
 *    model
 *
 * Relationships to classes that have not been converted yet are wired up
 * lazily — see `pendingRelationshipResolutions`. Combined with steps 8 and 9
 * this is what makes circular `A -> B -> A` model pairs work regardless of
 * the order the user calls `toModel()`.
 *
 * @param decoratedClass - The class decorated with @Node, @Property, @Relationship
 * @param neogma - The Neogma instance
 *
 * @returns A NeogmaModel identical to what ModelFactory would produce
 *
 * @example
 * Recommended — types inferred straight from the decorated class:
 * ```typescript
 * import Type from 'typebox';
 *
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @PrimaryKey()
 *   @Property(Type.String()) id!: string;
 *   @Property(Type.String({ minLength: 3 })) name!: string;
 *
 *   @Relationship({ name: 'CREATES', direction: 'out', model: () => OrderNode })
 *   Orders!: Related<typeof OrderNode>;
 * }
 *
 * const Users = toModel(UserNode, neogma); // fully typed
 * ```
 *
 * @example
 * Escape hatch — pass explicit generics when needed (mirrors `ModelFactory`):
 * ```typescript
 * const Users = toModel<UserAttrs, UsersRelatedNodes, UsersStatics, UsersMethods>(
 *   UserNode, neogma,
 * );
 * ```
 */
// Overload 1 — infer Properties/RelatedNodes/Methods/Statics from the class.
export function toModel<TClass extends NodeEntityClass>(
  decoratedClass: TClass,
  neogma: Neogma,
): NeogmaModel<
  AsNeo4jProperties<InferProperties<InstanceType<TClass>>>,
  InferRelatedNodes<InstanceType<TClass>>,
  InferMethods<InstanceType<TClass>>,
  InferStatics<TClass>
>;

// Overload 2 — explicit generics for callers that want to override the
// inferred shape (or for backwards-compat with code that passed Attrs).
export function toModel<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject = object,
  StaticsI extends AnyObject = object,
  MethodsI extends AnyObject = object,
>(
  decoratedClass: NodeEntityClass,
  neogma: Neogma,
): NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, StaticsI>;

// Implementation
export function toModel<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject = object,
  StaticsI extends AnyObject = object,
  MethodsI extends AnyObject = object,
>(
  decoratedClass: NodeEntityClass,
  neogma: Neogma,
): NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, StaticsI> {
  // 1. Read metadata — prefer WeakMap store (works for both TC39 and legacy
  // decorators), fall back to Symbol.metadata for backwards compatibility.
  const wmStore = readClassMetadataStore(decoratedClass);
  const classMetadata = wmStore ?? decoratedClass[Symbol.metadata];
  if (!classMetadata) {
    throw new NeogmaModelSchemaError(
      `Class "${decoratedClass.name}" has no decorator metadata. ` +
        `Ensure it is decorated with @Node.`,
      { className: decoratedClass.name },
    );
  }

  const nodeMetadata = readField<NodeMetadata>(
    wmStore,
    classMetadata,
    NEOGMA_NODE_KEY,
  );
  if (!nodeMetadata) {
    throw new NeogmaModelSchemaError(
      `Class "${decoratedClass.name}" is missing @Node decorator.`,
      { className: decoratedClass.name },
    );
  }

  const propertyMetadataList = readField<PropertyMetadata[]>(
    wmStore,
    classMetadata,
    NEOGMA_PROPERTIES_KEY,
    [],
  )!;

  const relationshipMetadataList = readField<RelationshipMetadata[]>(
    wmStore,
    classMetadata,
    NEOGMA_RELATIONSHIPS_KEY,
    [],
  )!;

  // 2. Resolve primaryKeyField from @PrimaryKey decorator.
  const resolvedPrimaryKeyField = readField<string>(
    wmStore,
    classMetadata,
    NEOGMA_PRIMARY_KEY_FIELD,
  );

  if (resolvedPrimaryKeyField !== undefined) {
    // @PrimaryKey auto-registers as @Property in both TC39 and legacy paths,
    // so normally this check is redundant. It remains as a safety net for
    // edge cases (e.g. programmatic metadata construction).
    const propertyKeys = (propertyMetadataList as PropertyMetadata[]).map(
      (p) => p.propertyKey,
    );
    if (!propertyKeys.includes(resolvedPrimaryKeyField)) {
      throw new NeogmaModelSchemaError(
        `@PrimaryKey is applied to field "${resolvedPrimaryKeyField}" on class ` +
          `"${decoratedClass.name}", but that field is not registered as a ` +
          `property. This is unexpected — @PrimaryKey should auto-register ` +
          `the field as a @Property.`,
        {
          className: decoratedClass.name,
          propertyKey: resolvedPrimaryKeyField,
        },
      );
    }
  }

  // 3. Build schema for ModelFactory. Annotated @Property fields contribute
  // their TypeBox schema directly; bare `@Property()` (no schema argument)
  // gets a `Type.Any()` placeholder — the property key is still tracked so
  // the field participates in create/update but no validation runs. This
  // matches the `@Property()` decorator's documented "tracked but not
  // validated" behaviour.
  const schema: Record<string, PropertySchema> = {};

  for (const propertyMetadata of propertyMetadataList) {
    schema[propertyMetadata.propertyKey] =
      propertyMetadata.schema ?? Type.Any();
  }

  // 4. Build relationships config. Targets that haven't been converted yet
  // get a placeholder `model` reference that's patched in step 8 once the
  // target's own `toModel()` call lands. This is what makes circular
  // `A -> B -> A` model pairs work regardless of declaration order.

  // 4a. Resolve any deferred relationship properties — these are functions
  // stored by @Relationship when `properties: () => config` was used.
  // By now, static field initializers have run, so the functions can be
  // safely called.
  for (const relMeta of relationshipMetadataList as RelationshipMetadata[]) {
    if (relMeta.deferredProperties && !relMeta.properties) {
      relMeta.properties = normalizeRelationshipProperties(
        relMeta.deferredProperties(),
      );
      relMeta.deferredProperties = undefined;
    }
  }

  const relationships: Record<string, RelationshipConfig> = {};
  const deferredTargets: Array<{
    targetClass: NodeEntityClass;
    alias: string;
  }> = [];

  for (const relationshipMetadata of relationshipMetadataList) {
    // Resolve model reference
    let resolvedModel: UntypedNeogmaModel | 'self' | null;
    if (relationshipMetadata.model === 'self') {
      resolvedModel = 'self';
    } else {
      let targetClass: NodeEntityClass;
      try {
        targetClass = relationshipMetadata.model();
      } catch (err) {
        throw new NeogmaModelSchemaError(
          `Failed to resolve target class for @Relationship ` +
            `"${relationshipMetadata.alias}" on "${decoratedClass.name}": ` +
            `${err instanceof Error ? err.message : String(err)}. ` +
            `Verify the lazy \`model: () => OtherNode\` reference is in scope.`,
          {
            className: decoratedClass.name,
            propertyKey: relationshipMetadata.alias,
          },
        );
      }
      const alreadyBuiltModel = modelRegistry.get(targetClass);
      if (alreadyBuiltModel) {
        resolvedModel = alreadyBuiltModel;
      } else {
        resolvedModel = null;
        deferredTargets.push({
          targetClass,
          alias: relationshipMetadata.alias,
        });
      }
    }

    const relationshipConfig: RelationshipConfig = {
      // Cast the null placeholder — it's replaced in step 8 before any query
      // reads relationship metadata off the model.
      model: resolvedModel as UntypedNeogmaModel | 'self',
      direction: relationshipMetadata.direction,
      name: relationshipMetadata.name,
    };

    // Relationship properties carry their TypeBox schema (or a Type.Any()
    // placeholder for unannotated entries) directly.
    if (
      relationshipMetadata.properties &&
      relationshipMetadata.properties.length > 0
    ) {
      const relationshipProperties: Record<
        string,
        { property: string; schema: PropertySchema }
      > = {};

      for (const propertyEntry of relationshipMetadata.properties) {
        relationshipProperties[propertyEntry.alias] = {
          property: propertyEntry.property,
          schema: propertyEntry.schema ?? Type.Any(),
        };
      }

      relationshipConfig.properties = relationshipProperties;
    }

    relationships[relationshipMetadata.alias] = relationshipConfig;
  }

  // 5. Extract statics from the class
  const extractedStatics = extractStaticMethods(decoratedClass);

  // 6. Extract instance methods from prototype
  const extractedMethods = extractInstanceMethods(decoratedClass);

  // 7. Call ModelFactory with the assembled schema, relationships, statics,
  // and methods extracted from the decorated class.
  const model = ModelFactory<
    Properties,
    RelatedNodesToAssociateI,
    StaticsI,
    MethodsI
  >(
    {
      schema: schema as {
        [K in keyof Properties]: PropertySchema<Properties>;
      },
      label: nodeMetadata.label,
      primaryKeyField: resolvedPrimaryKeyField as Extract<
        keyof Properties,
        string
      >,
      relationships:
        Object.keys(relationships).length > 0
          ? (relationships as Partial<RelationshipsI<RelatedNodesToAssociateI>>)
          : undefined,
      statics:
        Object.keys(extractedStatics).length > 0
          ? (extractedStatics as Partial<StaticsI>)
          : undefined,
      methods:
        Object.keys(extractedMethods).length > 0
          ? (extractedMethods as Partial<MethodsI>)
          : undefined,
    },
    neogma,
  );

  // 8. Register in model registry for relationship resolution
  modelRegistry.set(decoratedClass, model);
  const untypedModel = model as unknown as UntypedNeogmaModel;

  // 9. Queue this model's deferred relationship targets. ModelFactory has
  // cloned the relationships object, so we point the pending queue at the
  // model's live `relationships` static — that's what the query path reads.
  for (const deferred of deferredTargets) {
    const queue =
      pendingRelationshipResolutions.get(deferred.targetClass) ?? [];
    queue.push({ ownerModel: untypedModel, alias: deferred.alias });
    pendingRelationshipResolutions.set(deferred.targetClass, queue);
  }

  // 10. Flush any pending resolutions waiting on THIS class — earlier
  // `toModel()` calls that pointed at this class before it was built.
  // Patching `waiter.ownerModel.relationships[waiter.alias].model` mutates
  // ModelFactory's live clone in place.
  const waiters = pendingRelationshipResolutions.get(decoratedClass);
  if (waiters) {
    for (const waiter of waiters) {
      if (!waiter.ownerModel.relationships) {
        console.warn(
          `[neogma] Skipping deferred relationship resolution for alias "${waiter.alias}" — owner model has no relationships.`,
        );
        continue;
      }
      const ownerRelationships = waiter.ownerModel.relationships as Record<
        string,
        RelationshipConfig
      >;
      const entry = ownerRelationships[waiter.alias];
      if (entry) {
        entry.model = untypedModel;
      }
    }
    pendingRelationshipResolutions.delete(decoratedClass);
  }

  return model;
}
