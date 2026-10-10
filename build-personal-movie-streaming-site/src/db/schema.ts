import {
  bigint,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  posterUrl: text("poster_url"),
  genre: text("genre").default("").notNull(),
  year: integer("year"),
  source: text("source").notNull(), // 'local' | 'gdrive'
  filePath: text("file_path"), // relative path within storage/uploads for local files
  driveFileId: text("drive_file_id"), // google drive file id for gdrive sources
  mimeType: text("mime_type").default("video/mp4").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;

export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey(), // always 1 (singleton row)
  googleRefreshToken: text("google_refresh_token"),
  googleEmail: text("google_email"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;

export const watchProgress = pgTable("watch_progress", {
  movieId: integer("movie_id")
    .primaryKey()
    .references(() => movies.id, { onDelete: "cascade" }),
  positionSeconds: integer("position_seconds").default(0).notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WatchProgress = typeof watchProgress.$inferSelect;
