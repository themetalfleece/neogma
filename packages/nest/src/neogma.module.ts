import type { DynamicModule } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { clearModelRegistry } from 'neogma';

import { NEOGMA_INSTANCE, NEOGMA_MODULE_OPTIONS } from './neogma.constants';
import type {
  NeogmaModuleAsyncOptions,
  NeogmaModuleOptions,
} from './neogma.interfaces';
import { NeogmaService } from './neogma.service';

/**
 * Returns the DI injection token for a decorated model class.
 *
 * @example
 * ```typescript
 * constructor(@Inject(getModelToken(UserNode)) private Users: UserModel) {}
 * ```
 */
export function getModelToken(cls: { name: string }): string {
  return `neogma:model:${cls.name}`;
}

/**
 * NestJS dynamic module for neogma integration.
 *
 * Usage:
 *
 *   // Synchronous — config available at import time
 *   NeogmaModule.forRoot({
 *     connection: { url: 'bolt://localhost:7687', username: 'neo4j', password: 'pass' },
 *   })
 *
 *   // Asynchronous — config from ConfigService or other provider
 *   NeogmaModule.forRootAsync({
 *     imports: [ConfigModule],
 *     inject:  [ConfigService],
 *     useFactory: (cfg: ConfigService) => ({
 *       connection: {
 *         url:      cfg.get('NEO4J_URL')!,
 *         username: cfg.get('NEO4J_PASSWORD')!,
 *         password: cfg.get('NEO4J_PASSWORD')!,
 *       },
 *     }),
 *   })
 *
 *   // Register decorated model classes for DI
 *   NeogmaModule.forFeature([OrderNode, UserNode])
 *
 * The module is @Global so NeogmaService / NEOGMA_INSTANCE are available
 * everywhere without re-importing.
 */
@Global()
@Module({})
export class NeogmaModule {
  static forRoot(options: NeogmaModuleOptions): DynamicModule {
    return {
      module: NeogmaModule,
      providers: [
        { provide: NEOGMA_MODULE_OPTIONS, useValue: options },
        NeogmaService,
        {
          provide: NEOGMA_INSTANCE,
          useFactory: (svc: NeogmaService) => svc.neogma,
          inject: [NeogmaService],
        },
      ],
      exports: [NeogmaService, NEOGMA_INSTANCE],
    };
  }

  static forRootAsync(options: NeogmaModuleAsyncOptions): DynamicModule {
    return {
      module: NeogmaModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: NEOGMA_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        NeogmaService,
        {
          provide: NEOGMA_INSTANCE,
          useFactory: (svc: NeogmaService) => svc.neogma,
          inject: [NeogmaService],
        },
      ],
      exports: [NeogmaService, NEOGMA_INSTANCE],
    };
  }

  /**
   * Register decorated model classes (using @Node, @Property, @Relationship)
   * as injectable providers.
   *
   * Models are registered in order via `toModel()`, so pass dependency-leaf
   * models first (e.g. OrderNode before UserNode if UserNode relates to
   * OrderNode).
   *
   * Clears the model registry before registration to allow hot-reload
   * scenarios.
   *
   * **Important**: Model classes must be compiled WITHOUT
   * `experimentalDecorators` (they use TC39 Stage 3 decorators). Use
   * TypeScript project references to compile model files separately from
   * NestJS code. See the nestjs-app example for the setup.
   *
   * @example
   * ```typescript
   * // users.module.ts
   * @Module({
   *   imports: [NeogmaModule.forFeature([OrderNode, UserNode])],
   *   controllers: [UsersController],
   *   providers: [UsersService],
   * })
   * export class UsersModule {}
   *
   * // users.service.ts
   * @Injectable()
   * export class UsersService {
   *   constructor(
   *     @Inject(getModelToken(UserNode)) private Users: UserModel,
   *   ) {}
   * }
   * ```
   */
  static forFeature(models: Array<{ name: string }>): DynamicModule {
    clearModelRegistry();

    const providers = models.map((cls) => ({
      provide: getModelToken(cls),
      useFactory: (svc: NeogmaService) => svc.neogma.model(cls as any),
      inject: [NeogmaService],
    }));

    return {
      module: NeogmaModule,
      providers,
      exports: providers.map((p) => p.provide),
    };
  }
}
