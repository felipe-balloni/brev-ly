import {
    integer,
    pgTable,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const urls = pgTable('urls', {
    id: varchar('id', { length: 36 })
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    originalUrl: text('original_url').notNull(),
    shortenedUrl: text('shortened_url').notNull().unique(),
    accessCount: integer('access_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
