CREATE INDEX `site_events_date_idx` ON `site_events` (`occurred_date`);--> statement-breakpoint
CREATE INDEX `site_events_name_date_idx` ON `site_events` (`event_name`,`occurred_date`);--> statement-breakpoint
CREATE INDEX `site_events_visitor_idx` ON `site_events` (`anonymous_id`);