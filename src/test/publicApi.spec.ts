/**
 * Public-API smoke test for the published `neogma` package.
 *
 * Unlike the rest of the suite (which imports from `../*` source files),
 * this spec deliberately requires the **built `dist/index.js`** — the exact
 * artefact that `package.json` `"main"` points at. The intent is to catch
 * regressions where a public export is renamed or accidentally dropped from
 * the bundle, even if the in-source equivalent is still around.
 *
 * If this file fails with "Cannot find module '../../dist'", run `pnpm build`
 * first. CI runs `pnpm build` (via `prepare`) before tests, so this is only a
 * local-dev concern.
 *
 * No Neo4j connection is required — the assertions are purely structural.
 */
import * as fs from 'fs';
import * as path from 'path';

const distEntry = path.resolve(__dirname, '../../dist/index.js');

// Eager-require the built artefact at module scope so we can extract the
// decorator functions before the class-decoration site below executes
// (TC39 `@Decorator` syntax binds to identifiers in scope at parse time;
// it does not accept inline casts or call expressions wrapped in parens).
if (!fs.existsSync(distEntry)) {
  throw new Error(
    `[publicApi.spec] Built artefact not found at ${distEntry}. ` +
      `Run \`pnpm build\` first.`,
  );
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const distApi = require(distEntry) as Record<string, unknown>;

/**
 * Type the extracted decorators with the same shapes the real `@Node` /
 * `@Property` use in source — TC39 stage-3 form. The runtime functions
 * pulled from `dist/` ARE these signatures; we just have to tell TS so the
 * `@NodeDec(...)` / `@PropertyDec(...)` call sites below typecheck.
 */
type NodeDecoratorFactory = (opts: {
  label: string | string[];
  primaryKeyField?: string;
}) => <T extends new (...args: never[]) => object>(
  target: T,
  context: ClassDecoratorContext<T>,
) => T;
type PropertyDecoratorFactory = (
  schema?: unknown,
) => (value: undefined, context: ClassFieldDecoratorContext) => void;

const NodeDec = distApi.Node as NodeDecoratorFactory;
const PropertyDec = distApi.Property as PropertyDecoratorFactory;
const NodeEntityClass = distApi.NodeEntity as new () => object;
const TypeBuilder = distApi.Type as { String: (opts?: unknown) => unknown };

@NodeDec({ label: 'PublicApiTestNode', primaryKeyField: 'id' })
class PublicApiTestNode extends NodeEntityClass {
  @PropertyDec(TypeBuilder.String())
  id!: any;
}

describe('public API surface (built dist/)', () => {
  const api = distApi;

  describe('core classes & factories', () => {
    it('exports the Neogma connection class', () => {
      expect(typeof api.Neogma).toBe('function');
      expect(api.Neogma).toBeDefined();
    });

    it('exports the legacy ModelFactory factory function', () => {
      expect(typeof api.ModelFactory).toBe('function');
    });

    it('exports BindParam', () => {
      expect(typeof api.BindParam).toBe('function');
    });

    it('exports QueryBuilder', () => {
      expect(typeof api.QueryBuilder).toBe('function');
    });

    it('exports QueryRunner', () => {
      expect(typeof api.QueryRunner).toBe('function');
    });

    it('exports Literal', () => {
      expect(typeof api.Literal).toBe('function');
    });
  });

  describe('decorator API', () => {
    it('exports @Node, @Property, @Relationship decorator factories', () => {
      expect(typeof api.Node).toBe('function');
      expect(typeof api.Property).toBe('function');
      expect(typeof api.Relationship).toBe('function');
    });

    it('exports the NodeEntity base class', () => {
      expect(typeof api.NodeEntity).toBe('function');
    });

    it('exports the toModel bridge', () => {
      expect(typeof api.toModel).toBe('function');
    });

    it('exports clearModelRegistry (test-only helper)', () => {
      expect(typeof api.clearModelRegistry).toBe('function');
    });
  });

  describe('TypeBox re-exports', () => {
    it('exports Type (default TypeBox builder)', () => {
      expect(typeof api.Type).toBe('object');
      // Spot-check a couple of TypeBox builders so we know Type is the real
      // namespace and not an accidentally-empty re-export.
      const TypeNs = api.Type as Record<string, unknown>;
      expect(typeof TypeNs.String).toBe('function');
      expect(typeof TypeNs.Number).toBe('function');
      expect(typeof TypeNs.Optional).toBe('function');
    });

    it('exports Value (TypeBox runtime validator)', () => {
      expect(typeof api.Value).toBe('object');
      const ValueNs = api.Value as Record<string, unknown>;
      expect(typeof ValueNs.Check).toBe('function');
      expect(typeof ValueNs.Errors).toBe('function');
    });

    it('Type.String() produces a TypeBox schema that Value.Check validates', () => {
      const TypeNs = api.Type as {
        String: (opts?: { minLength?: number }) => unknown;
      };
      const ValueNs = api.Value as {
        Check: (schema: unknown, value: unknown) => boolean;
      };
      const schema = TypeNs.String({ minLength: 3 });
      expect(ValueNs.Check(schema, 'hello')).toBe(true);
      expect(ValueNs.Check(schema, 'no')).toBe(false);
      expect(ValueNs.Check(schema, 42)).toBe(false);
    });
  });

  describe('Where operator symbols (Op)', () => {
    it('exports Op with the common comparison symbols', () => {
      expect(typeof api.Op).toBe('object');
      const Op = api.Op as Record<string, unknown>;
      for (const key of [
        'eq',
        'ne',
        'gt',
        'gte',
        'lt',
        'lte',
        'in',
        'contains',
      ]) {
        expect(typeof Op[key]).toBe('symbol');
      }
    });
  });

  describe('Errors', () => {
    it('exports the documented error classes', () => {
      for (const name of [
        'NeogmaError',
        'NeogmaConnectivityError',
        'NeogmaConstraintError',
        'NeogmaInstanceValidationError',
        'NeogmaNotFoundError',
      ]) {
        expect(typeof api[name]).toBe('function');
      }
    });

    it('error classes are instantiable and extend Error', () => {
      const NeogmaError = api.NeogmaError as new (
        msg: string,
        data?: unknown,
      ) => Error;
      const err = new NeogmaError('test');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('test');
    });
  });

  describe('Sessions helpers', () => {
    it('exports the session/transaction helpers', () => {
      expect(typeof api.getSession).toBe('function');
      expect(typeof api.getTransaction).toBe('function');
      expect(typeof api.getRunnable).toBe('function');
    });
  });

  describe('neo4j-driver re-export', () => {
    it('exposes neo4j-driver under the `neo4jDriver` namespace', () => {
      expect(typeof api.neo4jDriver).toBe('object');
      const drv = api.neo4jDriver as Record<string, unknown>;
      expect(typeof drv.driver).toBe('function');
      expect(typeof drv.auth).toBe('object');
    });
  });

  describe('decorator-path end-to-end (smoke)', () => {
    it('decorated class (built from dist/) is constructible and has Symbol.metadata populated', () => {
      // `PublicApiTestNode` is declared at module scope above using the
      // decorators pulled from `dist/`. If decorators or NodeEntity were
      // broken in the published artefact, the module would have thrown at
      // load-time and this whole suite would fail to run.
      const instance = new PublicApiTestNode();
      expect(instance).toBeInstanceOf(NodeEntityClass);

      // The polyfill (loaded as a side-effect of `dist/Decorators/index.js`)
      // populates `Symbol.metadata` on decorated classes. `Symbol.metadata`
      // is a well-known symbol typed by `lib.esnext.decorators` (declared
      // globally via the base tsconfig's `lib`).
      const metadata = PublicApiTestNode[Symbol.metadata];
      expect(metadata).toBeDefined();
    });
  });
});
