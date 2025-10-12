import * as dotenv from 'dotenv';

// Load .env file with quiet mode in CI to suppress console logs
dotenv.config({ quiet: process.env.CI === 'true' });
