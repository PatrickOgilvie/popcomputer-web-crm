-- A contact's company, and a deal's company and contact, belong to the same
-- member as the contact or deal. A form names them by id, so the database
-- refuses any other member's, whatever writes the row; each trigger's name is
-- the constraintName the actions show beside the field it guards.
CREATE TRIGGER `contacts_company_owner_insert` BEFORE INSERT ON `contacts`
WHEN NEW.`company_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `companies` WHERE `id` = NEW.`company_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'contacts_company_owner');
END;
--> statement-breakpoint
CREATE TRIGGER `contacts_company_owner_update` BEFORE UPDATE OF `company_id`, `user_id` ON `contacts`
WHEN NEW.`company_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `companies` WHERE `id` = NEW.`company_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'contacts_company_owner');
END;
--> statement-breakpoint
CREATE TRIGGER `deals_company_owner_insert` BEFORE INSERT ON `deals`
WHEN NEW.`company_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `companies` WHERE `id` = NEW.`company_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'deals_company_owner');
END;
--> statement-breakpoint
CREATE TRIGGER `deals_company_owner_update` BEFORE UPDATE OF `company_id`, `user_id` ON `deals`
WHEN NEW.`company_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `companies` WHERE `id` = NEW.`company_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'deals_company_owner');
END;
--> statement-breakpoint
CREATE TRIGGER `deals_contact_owner_insert` BEFORE INSERT ON `deals`
WHEN NEW.`contact_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `contacts` WHERE `id` = NEW.`contact_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'deals_contact_owner');
END;
--> statement-breakpoint
CREATE TRIGGER `deals_contact_owner_update` BEFORE UPDATE OF `contact_id`, `user_id` ON `deals`
WHEN NEW.`contact_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `contacts` WHERE `id` = NEW.`contact_id` AND `user_id` = NEW.`user_id`)
BEGIN
  SELECT RAISE(ABORT, 'deals_contact_owner');
END;
