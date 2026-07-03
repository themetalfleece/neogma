# `@neogma-examples/basic-app`

A runnable, end-to-end example that exercises every public neogma feature against a local Neo4j instance. Use it as a reference when wiring neogma into a new project.

> Replaces the previous standalone repo
> [`themetalfleece/neogma-example-app`](https://github.com/themetalfleece/neogma-example-app).

The example uses the **decorator-based** API exclusively (`@Node` / `@Property` / `@Relationship` + `toModel`) — the path we recommend for new code.

## Layout

```
src/
├── index.ts              # thin orchestrator
├── lib/
│   ├── log.ts            # console formatting helpers
│   └── neogma.ts         # connect() helper
├── models/
│   ├── OrderItemNode.ts
│   ├── OrderNode.ts
│   ├── TagNode.ts
│   ├── UserNode.ts
│   └── index.ts          # buildModels(neogma)
└── sections/
    ├── 01-validation.ts
    ├── 02-create.ts
    ├── 03-read.ts
    ├── 04-update.ts
    ├── 05-relationships.ts
    ├── 06-query-builder.ts
    ├── 07-sessions.ts
    ├── 08-delete.ts
    └── 09-cleanup.ts
```

Each section file exports a single `demonstrateXxx(...)` function that the orchestrator runs in order.

## What it demonstrates

| Section | API exercised |
| --- | --- |
| `lib/neogma.ts` | `new Neogma`, `verifyConnectivity`, `driver`, `queryRunner`, `driver.close` |
| `models/*` | `@Node`, `@Property`, `@Relationship`, `NodeEntity`, `Related<…>`, `toModel`, `clearModelRegistry` |
| Validation | TypeBox schemas + `NeogmaInstanceValidationError` |
| Create | `createOne` (with nested attributes + relationship properties), `createMany`, `build` |
| Read | `findOne`, `findMany` with `Op.gte` / `Op.in` / `Op.contains`, ordering, paging, eager `relationships` |
| Update | `instance.save()` with `changed`, `Model.update`, instance methods declared on the class |
| Relationships | `relateTo` (static + instance), `findRelationships`, `createRelationship`, `deleteRelationships` |
| QueryBuilder | `match`, optional-match, `where`, `with`, `unwind`, `merge`, `onCreateSet`, `onMatchSet`, `set`, `return`, `orderBy`, `limit`, `skip`, `raw`, `forEach`, `call`, `.run()` |
| BindParam / Literal | parameterised queries, `new Literal('datetime()')`, `getUniqueNameAndAdd` |
| Sessions / Tx | `getSession`, `getTransaction` (commit + rollback) |
| Deletion | `instance.delete`, `Model.delete` |
| Errors | catches `NeogmaInstanceValidationError`, `NeogmaNotFoundError` |

## Prerequisites

- **Node.js** ≥ 24.13.0 (see the root [`package.json`](../../package.json) `engines` field). If you use [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm), install the latest LTS that satisfies that range.
- **pnpm 11.9.0** — the easiest way to install it is via [Corepack](https://nodejs.org/api/corepack.html) (shipped with Node):
  ```bash
  corepack enable                # one-time, enables pnpm/yarn shims
  corepack prepare pnpm@11.9.0 --activate
  pnpm --version                 # should print 11.9.0
  ```
- **Docker + Docker Compose** (to run Neo4j locally).
- The **neogma library built** in the repo root (this example imports `neogma` from the workspace and needs `dist/`):
  ```bash
  pnpm install         # from repo root, installs every workspace package
  pnpm build           # builds the library so `neogma/dist/index.js` exists
  ```

> **Workspace vs. npm — important.** This example uses `"neogma": "workspace:*"` so it always pulls from the local checkout via the pnpm workspace. If you are copying this app into a project of your own, replace that with a real npm version:
> ```jsonc
> // examples/basic-app/package.json (your fork)
> "dependencies": {
>   "neogma": "^1.16.0"           // any published version from npmjs.com/package/neogma
> }
> ```
> Then run `npm install` / `pnpm install` / `yarn install` in your own project as normal — no monorepo setup required.

## Start Neo4j

From the repo root:

```bash
docker compose up -d
```

The default credentials are `neo4j` / `password` on `bolt://localhost:7687`.

## Configure credentials (optional)

```bash
cp examples/basic-app/.env.example examples/basic-app/.env
# edit if your Neo4j is not on localhost / has different credentials
```

If the file is missing, the script falls back to the defaults above.

## Run the example

```bash
pnpm --filter @neogma-examples/basic-app build
pnpm --filter @neogma-examples/basic-app start
```

Or, equivalently, the `dev` script which builds + runs in one shot:

```bash
pnpm --filter @neogma-examples/basic-app dev
```

The script creates and tears down its own data in your Neo4j instance — every node/relationship it touches is removed before the process exits.
