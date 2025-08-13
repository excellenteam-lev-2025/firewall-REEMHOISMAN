import { defineConfig } from 'drizzle-kit';
import { ENV } from './src/config/env.ts';

export default defineConfig({
    out: './drizzle',
    dialect: 'postgresql',
    schema: './src/types/models/rules.ts',
    dbCredentials: {
        url: ENV.DB_URI,
    },
    strict: true,
    verbose: true,
});
