import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Neogma } from 'neogma';

import { NEOGMA_MODULE_OPTIONS } from './neogma.constants';
import type { NeogmaModuleOptions } from './neogma.interfaces';

/**
 * Manages the Neogma instance lifecycle within NestJS.
 *
 * - Creates the driver on module init and verifies connectivity.
 * - Closes the driver cleanly on application shutdown.
 * - Exposes the raw Neogma instance for model registration and queries.
 */
@Injectable()
export class NeogmaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(NeogmaService.name);
  public readonly neogma: Neogma;

  constructor(
    @Inject(NEOGMA_MODULE_OPTIONS)
    private readonly config: NeogmaModuleOptions,
  ) {
    this.neogma = new Neogma(config.connection, config.options);
  }

  async onModuleInit(): Promise<void> {
    await this.neogma.verifyConnectivity();
    this.logger.log(
      `Connected to Neo4j at ${this.config.connection.url} ` +
        `(db: ${this.neogma.database ?? 'default'})`,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.neogma.driver.close();
    this.logger.log('Neo4j driver closed');
  }
}
