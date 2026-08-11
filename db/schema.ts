import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const menuPages = sqliteTable("menu_pages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageKey: text("image_key"),
  imageUrl: text("image_url"),
  position: integer("position").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const siteEvents = sqliteTable("site_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventName: text("event_name").notNull(),
  anonymousId: text("anonymous_id").notNull(),
  sessionId: text("session_id").notNull(),
  path: text("path").notNull(),
  referrerHost: text("referrer_host"),
  deviceType: text("device_type").notNull(),
  occurredAt: text("occurred_at").notNull(),
  occurredDate: text("occurred_date").notNull(),
}, (table) => [
  index("site_events_date_idx").on(table.occurredDate),
  index("site_events_name_date_idx").on(table.eventName, table.occurredDate),
  index("site_events_visitor_idx").on(table.anonymousId),
]);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
