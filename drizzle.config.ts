import * as dotenv from 'dotenv';
import {defineConfig} from "drizzle-kit";

dotenv.config();

export default defineConfig({
    out: "./drizzle",
    dialect: "postgresql",
    schema: "./src/types/models/rules.ts",
    dbCredentials: {
        url: process.env.DB_URI,
    },

    strict: true,
    verbose: true,
});

