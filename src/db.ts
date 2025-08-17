import Database from './config/Database.js';

const db = Database.getInstance().getDb();

export default db;
