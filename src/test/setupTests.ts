import * as dotenv from 'dotenv';

// Load .env file with quiet mode in CI to suppress console logs
dotenv.config({ quiet: true });

// Import modules to ensure proper module initialization order
import '../QueryBuilder';
import '../QueryRunner';
// Pin the Symbol.metadata polyfill before any decorator-using suite loads.
// (It is also re-imported by every decorator chain, but loading it here makes
// the ordering explicit and survives reordering of the imports above.)
import '../Decorators/polyfill';
