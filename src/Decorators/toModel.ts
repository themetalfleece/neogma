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
  NEOGMA_PROPERTIES_KEY,
  NEOGMA_RELATIONSHIPS_KEY,
  type NodeMetadata,
  type PropertyMetadata,
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
 * @Node({ label: 'User', primaryKeyField: 'id' })
 * class UserNode extends NodeEntity {
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
  // 1. Read metadata
  const classMetadata = decoratedClass[Symbol.metadata];
  if (!classMetadata) {
    throw new NeogmaModelSchemaError(
      `Class "${decoratedClass.name}" has no decorator metadata. ` +
        `Ensure it is decorated with @Node.`,
      { className: decoratedClass.name },
    );
  }

  const nodeMetadata = getMetadata<NodeMetadata>(
    classMetadata,
    NEOGMA_NODE_KEY,
  );
  if (!nodeMetadata) {
    throw new NeogmaModelSchemaError(
      `Class "${decoratedClass.name}" is missing @Node decorator.`,
      { className: decoratedClass.name },
    );
  }

  const propertyMetadataList =
    getMetadata<PropertyMetadata[]>(classMetadata, NEOGMA_PROPERTIES_KEY) ?? [];
  const relationshipMetadataList =
    getMetadata<RelationshipMetadata[]>(
      classMetadata,
      NEOGMA_RELATIONSHIPS_KEY,
    ) ?? [];

  // 2. Build schema for ModelFactory. Annotated @Property fields contribute
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

  // 3. Build relationships config. Targets that haven't been converted yet
  // get a placeholder `model` reference that's patched in step 8 once the
  // target's own `toModel()` call lands. This is what makes circular
  // `A -> B -> A` model pairs work regardless of declaration order.
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

  // 4. Extract statics from the class
  const classAsRecord = decoratedClass as unknown as Record<string, unknown>;
  const extractedStatics: Record<string, unknown> = {};
  const staticOwnKeys = Object.getOwnPropertyNames(decoratedClass).filter(
    (key) =>
      key !== 'prototype' &&
      key !== 'length' &&
      key !== 'name' &&
      typeof classAsRecord[key] === 'function',
  );
  for (const key of staticOwnKeys) {
    extractedStatics[key] = classAsRecord[key];
  }

  // 5. Extract instance methods from prototype
  const prototypeAsRecord = decoratedClass.prototype as Record<string, unknown>;
  const extractedMethods: Record<string, unknown> = {};
  const prototypeOwnKeys = Object.getOwnPropertyNames(
    decoratedClass.prototype,
  ).filter(
    (key) =>
      key !== 'constructor' && typeof prototypeAsRecord[key] === 'function',
  );
  for (const key of prototypeOwnKeys) {
    extractedMethods[key] = prototypeAsRecord[key];
  }

  // 6. Call ModelFactory with the assembled schema, relationships, statics,
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
      primaryKeyField: nodeMetadata.primaryKeyField as Extract<
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

  // 7. Register in model registry for relationship resolution
  modelRegistry.set(decoratedClass, model);
  const untypedModel = model as unknown as UntypedNeogmaModel;

  // 8. Queue this model's deferred relationship targets. ModelFactory has
  // cloned the relationships object, so we point the pending queue at the
  // model's live `relationships` static — that's what the query path reads.
  for (const deferred of deferredTargets) {
    const queue =
      pendingRelationshipResolutions.get(deferred.targetClass) ?? [];
    queue.push({ ownerModel: untypedModel, alias: deferred.alias });
    pendingRelationshipResolutions.set(deferred.targetClass, queue);
  }

  // 9. Flush any pending resolutions waiting on THIS class — earlier
  // `toModel()` calls that pointed at this class before it was built.
  // Patching `waiter.ownerModel.relationships[waiter.alias].model` mutates
  // ModelFactory's live clone in place.
  const waiters = pendingRelationshipResolutions.get(decoratedClass);
  if (waiters) {
    for (const waiter of waiters) {
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
