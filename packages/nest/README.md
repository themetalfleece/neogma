# @neogma/nest

NestJS integration module for [neogma](https://www.npmjs.com/package/neogma), a type-safe OGM for Neo4j.

## Installation

```bash
npm install @neogma/nest neogma @nestjs/common @nestjs/core
```

## Usage

### 1. Import the module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { NeogmaModule } from '@neogma/nest';

@Module({
  imports: [
    NeogmaModule.forRoot({
      connection: {
        url: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'password',
      },
    }),
  ],
})
export class AppModule {}
```

Or use `forRootAsync` for dynamic configuration:

```typescript
NeogmaModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    connection: {
      url: cfg.get('NEO4J_URL')!,
      username: cfg.get('NEO4J_USERNAME')!,
      password: cfg.get('NEO4J_PASSWORD')!,
    },
  }),
});
```

### 2. Define models

Models can use either TC39 decorators (import from `'neogma'`) or legacy decorators (import from `'neogma/legacy'`). The `experimentalDecorators` compiler option is only needed for the legacy decorator path.

```typescript
// user.model.ts
import { Node, PrimaryKey, Property, NodeEntity, Type } from 'neogma/legacy';

@Node({ label: 'User' })
export class UserNode extends NodeEntity {
  @PrimaryKey(Type.String()) id!: string;
  @Property(Type.String({ minLength: 2 })) name!: string;
  @Property(Type.String()) email!: string;
}
```

### 3. Register models for DI

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { NeogmaModule } from '@neogma/nest';
import { UserNode } from './user.model';

@Module({
  imports: [NeogmaModule.forFeature([UserNode])],
  providers: [UsersService],
})
export class UsersModule {}
```

### 4. Inject models into services

```typescript
// users.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@neogma/nest';
import type { ModelOf } from '@neogma/nest';
import { UserNode } from './user.model';

type UserModel = ModelOf<typeof UserNode>;

@Injectable()
export class UsersService {
  constructor(@Inject(getModelToken(UserNode)) private Users: UserModel) {}

  async findAll() {
    return this.Users.findMany({});
  }

  async create(data: { id: string; name: string; email: string }) {
    return this.Users.createOne(data);
  }
}
```

## API

| Export                               | Description                                                             |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `NeogmaModule.forRoot(options)`      | Synchronous module registration with connection config                  |
| `NeogmaModule.forRootAsync(options)` | Async module registration (e.g. from ConfigService)                     |
| `NeogmaModule.forFeature(models)`    | Register decorated model classes as injectable providers                |
| `NeogmaService`                      | Injectable service exposing the `Neogma` instance                       |
| `getModelToken(cls)`                 | Returns the DI injection token for a model class                        |
| `ModelOf<T>`                         | Type helper that extracts the `NeogmaModel` type from a decorated class |
| `NEOGMA_INSTANCE`                    | Injection token for the raw `Neogma` instance                           |

## Example

See the [nestjs-app example](../../examples/nestjs-app) for a complete working application.

## License

MIT
