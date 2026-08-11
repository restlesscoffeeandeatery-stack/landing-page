CREATE TABLE `menu_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image_key` text,
	`image_url` text,
	`position` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text NOT NULL,
	`anonymous_id` text NOT NULL,
	`session_id` text NOT NULL,
	`path` text NOT NULL,
	`referrer_host` text,
	`device_type` text NOT NULL,
	`occurred_at` text NOT NULL,
	`occurred_date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
