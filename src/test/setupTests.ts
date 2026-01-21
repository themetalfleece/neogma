import * as dotenv from 'dotenv';

// Load .env file with quiet mode in CI to suppress console logs
dotenv.config({ quiet: true });

// Import Queries module first to ensure proper module initialization order
// This prevents circular dependency issues when test files import from Queries
import '../Queries';
