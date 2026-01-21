import * as dotenv from 'dotenv';

// Load .env file with quiet mode in CI to suppress console logs
dotenv.config({ quiet: true });

// Import modules to ensure proper module initialization order
import '../QueryBuilder';
import '../QueryRunner';
