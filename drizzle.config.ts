// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { ENV } from './src/config/env.js';

export default defineConfig({
    out: './drizzle',
    dialect: 'postgresql',
    schema: './src/types/models/rules.js',
    dbCredentials: {
        url: ENV.DB_URI,
    },
    strict: true,
    verbose: true,
});
