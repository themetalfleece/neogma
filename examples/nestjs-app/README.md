# NestJS + Neogma Example

A NestJS application demonstrating how to integrate **neogma** with NestJS using the **`@neogma/nest`** package and neogma's legacy decorator support (`neogma/legacy`).

## What this example shows

- **`@neogma/nest`** — the published NestJS integration package (`packages/nest`) providing `NeogmaModule`, `NeogmaService`, `forFeature()`, and injection tokens.
- **Neogma decorators in NestJS** — model classes use `@Node`, `@Property`, `@Relationship` from `neogma/legacy`, which work seamlessly alongside NestJS's `@Injectable`, `@Controller`, etc.
- **`NeogmaModule.forFeature()`** — registers decorated model classes as injectable NestJS providers.
- **CRUD controller** (`/users`) with models injected via `@Inject(getModelToken(UserNode))`.
- **Health check** endpoint (`/health`) verifying Neo4j connectivity.

## Prerequisites

- Node.js >= 24.13.0
- Docker (for Neo4j)

## Quick start

```bash
# From the repo root
docker compose up -d               # Start Neo4j
pnpm install                       # Install workspace deps (builds neogma + @neogma/nest)

# From this directory
cd examples/nestjs-app
pnpm install                       # Install example deps (own lockfile)
pnpm build                         # Compile
pnpm start                         # Run (http://localhost:3000)
pnpm demo                          # Or: run the end-to-end HTTP demo
```

### End-to-end demo

The `demo` script starts the server, exercises every CRUD endpoint via `fetch()`, and shuts down:

```bash
pnpm demo
```

## API endpoints

| Method   | Path         | Description          |
|----------|--------------|----------------------|
| `GET`    | `/health`    | Neo4j connectivity   |
| `POST`   | `/users`     | Create a user        |
| `GET`    | `/users`     | List all users       |
| `GET`    | `/users/:id` | Get user by id       |
| `PATCH`  | `/users/:id` | Update user by id    |
| `DELETE` | `/users/:id` | Delete user by id    |
| `DELETE` | `/users`     | Delete all users     |

## Project structure

```
src/
├── main.ts                        # NestJS bootstrap
├── app.module.ts                  # Root module (imports NeogmaModule from @neogma/nest)
├── demo.ts                        # End-to-end HTTP demo
├── models/                        # Neogma models using legacy decorators
│   ├── UserNode.ts                # @Node, @Property, @Relationship from neogma/legacy
│   ├── OrderNode.ts
│   └── index.ts
├── users/                         # Feature module
│   ├── users.module.ts            # Uses NeogmaModule.forFeature([OrderNode, UserNode])
│   ├── users.controller.ts        # REST endpoints
│   ├── users.service.ts           # Injects models via @Inject(getModelToken(UserNode))
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── index.ts
└── health/                        # Health check
    ├── health.module.ts
    ├── health.controller.ts
    └── index.ts
```

## Decorator compatibility

Neogma supports two decorator styles:

| Import path      | Decorator style               | Use when                                      |
|------------------|-------------------------------|-----------------------------------------------|
| `neogma`         | TC39 Stage 3 decorators       | Standalone projects without `experimentalDecorators` |
| `neogma/legacy`  | Legacy/experimental decorators | NestJS, Angular, or any `experimentalDecorators: true` project |

Both styles produce identical models via `toModel()`. The user-facing API (`@Node`, `@Property`, `@Relationship`, `NodeEntity`) is the same — only the import path differs.

This example uses `neogma/legacy` since NestJS requires `experimentalDecorators: true`.

## Using `forRootAsync` with `ConfigService`

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NeogmaModule } from '@neogma/nest';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NeogmaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow('NEO4J_URL'),
          username: config.getOrThrow('NEO4J_USERNAME'),
          password: config.getOrThrow('NEO4J_PASSWORD'),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
PORT=3000
```
