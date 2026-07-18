/**
 * Options passed to NeogmaModule.forRoot().
 */
export interface NeogmaModuleOptions {
  /** Neo4j connection config. */
  connection: {
    url: string;
    username: string;
    password: string;
    database?: string;
  };
  /** Optional Neogma constructor options (logger, etc.). */
  options?: {
    logger?: (message: string) => void;
    [key: string]: unknown;
  };
}

/**
 * Factory for async module configuration (useFactory pattern).
 */
export interface NeogmaModuleAsyncOptions {
  /** Optional modules to import for injecting config dependencies. */
  imports?: any[];
  /** Injection tokens whose values are passed to useFactory. */
  inject?: any[];
  /** Factory returning NeogmaModuleOptions (may be async). */
  useFactory: (
    ...args: any[]
  ) => Promise<NeogmaModuleOptions> | NeogmaModuleOptions;
}
