import { pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core';

export const rules = pgTable('rules', {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 10 }),
    value: varchar('value', { length: 45 }).unique(),
    mode: varchar('mode', { length: 10 }),
    active: boolean('active').default(true),
});
