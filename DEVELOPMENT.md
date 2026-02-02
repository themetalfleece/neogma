# Development Guide

This guide covers setting up Neogma for local development and contributing to the project.

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm), which will install node.js
- [Docker](https://www.docker.com/) and Docker Compose

## Setting up Node.js and Yarn

**Activate the project's Node.js version:**

```bash
nvm use
```

This will automatically use the Node.js version specified in `.nvmrc`.

**Enable Yarn via Corepack:**

```bash
corepack enable yarn
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
   yarn
   ```

2. **Ensure Neo4j is running** (see above)

3. **Configure environment variables:**
   Make sure you have a `.env` file with the Neo4j connection details (see `.env.example`)

4. **Run the tests:**
   ```bash
   yarn test
   ```

   The tests will automatically create temporary databases for each test suite to avoid conflicts.

## Development Workflow

**Build TypeScript:**
```bash
yarn build
```

**Lint code:**
```bash
yarn lint
```

**Format code:**
```bash
yarn format
```

**Run tests in watch mode:**
```bash
yarn test --watch
```
