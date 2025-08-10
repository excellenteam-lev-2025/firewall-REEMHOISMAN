import { Pool } from 'pg';
import {DB_URI} from './config/env.js'
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import fs from 'fs';

import { drizzle } from "drizzle-orm/node-postgres"

const db = drizzle(DB_URI);
const pool = db.$client;


export async function initDb() {
    await migrate(db, { migrationsFolder: 'drizzle' });
}


