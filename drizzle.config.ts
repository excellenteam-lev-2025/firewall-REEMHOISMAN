// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// טוען את ה-.env
dotenv.config({ path: '.env' });

// מייבא ישירות את ה-ENV שלך מ-env.ts
// חשוב: לשים סיומת .ts כדי ש-ts-node/tsx יוכל לטעון את הקובץ
import { ENV } from './src/config/env.ts';

export default defineConfig({
    out: './drizzle',
    dialect: 'postgresql',
    schema: './src/types/models/rules.ts',
    dbCredentials: {
        url: ENV.DB_URI, // אותו DB_URI שאתה מייצר ב-env.ts
    },
    strict: true,
    verbose: true,
});
