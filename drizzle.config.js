import { defineConfig } from "drizzle-kit";
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
//# sourceMappingURL=drizzle.config.js.map