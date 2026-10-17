CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deal_id` text,
	`contact_id` text,
	`company_id` text,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`due_on` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activities_body_length" CHECK(length("activities"."body") BETWEEN 1 AND 2000),
	CONSTRAINT "activities_kind" CHECK("activities"."kind" IN ('note', 'call', 'email', 'meeting', 'task')),
	CONSTRAINT "activities_one_subject" CHECK(("activities"."deal_id" IS NOT NULL) + ("activities"."contact_id" IS NOT NULL) + ("activities"."company_id" IS NOT NULL) <= 1),
	CONSTRAINT "activities_only_tasks_are_due" CHECK("activities"."kind" = 'task' OR ("activities"."due_on" IS NULL AND "activities"."completed_at" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `activities_user_kind_idx` ON `activities` (`user_id`,`kind`,`completed_at`,`due_on`);--> statement-breakpoint
CREATE INDEX `activities_deal_idx` ON `activities` (`deal_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `activities_contact_idx` ON `activities` (`contact_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `activities_company_idx` ON `activities` (`company_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`industry` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "companies_name_length" CHECK(length("companies"."name") BETWEEN 1 AND 100),
	CONSTRAINT "companies_website_length" CHECK("companies"."website" IS NULL OR length("companies"."website") <= 2048),
	CONSTRAINT "companies_industry_length" CHECK("companies"."industry" IS NULL OR length("companies"."industry") <= 60),
	CONSTRAINT "companies_notes_length" CHECK("companies"."notes" IS NULL OR length("companies"."notes") <= 2000)
);
--> statement-breakpoint
CREATE INDEX `companies_user_name_idx` ON `companies` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`title` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "contacts_name_length" CHECK(length("contacts"."name") BETWEEN 1 AND 100),
	CONSTRAINT "contacts_email_length" CHECK("contacts"."email" IS NULL OR length("contacts"."email") <= 254),
	CONSTRAINT "contacts_phone_length" CHECK("contacts"."phone" IS NULL OR length("contacts"."phone") <= 40),
	CONSTRAINT "contacts_title_length" CHECK("contacts"."title" IS NULL OR length("contacts"."title") <= 100),
	CONSTRAINT "contacts_notes_length" CHECK("contacts"."notes" IS NULL OR length("contacts"."notes") <= 2000)
);
--> statement-breakpoint
CREATE INDEX `contacts_user_name_idx` ON `contacts` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `contacts_company_idx` ON `contacts` (`company_id`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text,
	`contact_id` text,
	`title` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`expected_close_on` text,
	`notes` text,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "deals_title_length" CHECK(length("deals"."title") BETWEEN 1 AND 100),
	CONSTRAINT "deals_value_range" CHECK("deals"."value" BETWEEN 0 AND 1000000000),
	CONSTRAINT "deals_stage" CHECK("deals"."stage" IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
	CONSTRAINT "deals_notes_length" CHECK("deals"."notes" IS NULL OR length("deals"."notes") <= 2000),
	CONSTRAINT "deals_closed_when_won_or_lost" CHECK(("deals"."stage" IN ('won', 'lost')) = ("deals"."closed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `deals_user_stage_position_idx` ON `deals` (`user_id`,`stage`,`position`);--> statement-breakpoint
CREATE INDEX `deals_company_idx` ON `deals` (`company_id`);--> statement-breakpoint
CREATE INDEX `deals_contact_idx` ON `deals` (`contact_id`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);