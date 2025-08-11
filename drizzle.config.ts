
import { defineConfig } from "drizzle-kit";
import {DB_URI} from "./src/config/env.js";
import dotenv from "dotenv";

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

