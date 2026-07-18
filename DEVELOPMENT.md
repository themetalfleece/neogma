# Development Guide

This guide covers setting up Neogma for local development and contributing to the project.

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm), which will install Node.js
- [Docker](https://www.docker.com/) and Docker Compose
- [Corepack](https://nodejs.org/api/corepack.html) (bundled with Node.js)

## Setting up Node.js and pnpm

**Activate the project's Node.js version:**

```bash
nvm use
```

This will automatically use the Node.js version specified in `.nvmrc`.

**Enable pnpm via Corepack:**

Corepack reads the `packageManager` field in `package.json` and installs the exact
pnpm version on first use. You only need to enable it once per machine:

```bash
corepack enable
```

## Workspace layout

The repository is a [pnpm workspace](https://pnpm.io/pnpm-workspace_yaml):

- The root package is the published `neogma` library (`src/`, builds to `dist/`).
- `examples/*` holds runnable example apps that consume the built library.

Install everything (root + examples) with a single command from the repo root:

```bash
pnpm install
```

To run a script in a specific workspace:

```bash
pnpm --filter neogma test
pnpm --filter @neogma-examples/basic-app start
```

## Setting up Neo4j

Neogma requires a running Neo4j instance for unit tests. The easiest way to get started is using Docker Compose.

### Using Docker Compose (Recommended)

**Start Neo4j:**

```bash
docker compose up -d
```

This will start a Neo4j 5.x Enterprise instance with:
- HTTP interface on http://localhost:7474
- Bolt protocol on bolt://localhost:7687
- Default credentials: `neo4j/password`

**Note:** Enterprise Edition is required for temporary database support used in tests.

**Verify Neo4j is running:**

Open http://localhost:7474 in your browser and login with username `neo4j` and password `password`.

**Configure environment variables:**

```bash
cp .env.example .env
```

The `.env` file contains the connection details. You can modify them if you changed the Docker Compose configuration.

**Stop Neo4j:**

```bash
docker compose down
```

To also remove the data volumes:

```bash
docker compose down -v
```

### Manual Neo4j Installation

If you prefer not to use Docker:

1. Download and install [Neo4j Desktop](https://neo4j.com/download/) or [Neo4j Community Edition](https://neo4j.com/deployment-center/)
2. Create a new database with username `neo4j` and password `password`
3. Start the database
4. Copy `.env.example` to `.env` and update the connection details if needed

## Running Tests

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Ensure Neo4j is running** (see above)

3. **Configure environment variables:**
   Make sure you have a `.env` file with the Neo4j connection details (see `.env.example`)

4. **Run the tests:**
   ```bash
   pnpm test
   ```

   The tests will automatically create temporary databases for each test suite to avoid conflicts.

## Development Workflow

**Build TypeScript:**
```bash
pnpm build
```

**Lint code:**
```bash
pnpm lint
```

**Format code:**
```bash
pnpm format
```

**Run tests in watch mode:**
```bash
pnpm test --watch
```

**Run the example app:**
```bash
pnpm build                                  # build the library first
pnpm --filter @neogma-examples/basic-app start
```
