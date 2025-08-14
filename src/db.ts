// src/db.ts
import Database from './config/Database.js';

const databaseInstance = Database.getInstance();
export const pool = databaseInstance.getPool();
export const db = databaseInstance.getDb();
export const connectToDb = () => databaseInstance.connect();
export default Database;
