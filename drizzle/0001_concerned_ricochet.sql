CREATE TYPE "public"."report_resolution" AS ENUM('verified', 'disputed');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "resolution" "report_resolution";--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "confirmations_report_device_unique" ON "confirmations" USING btree ("report_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flags_report_device_unique" ON "flags" USING btree ("report_id","device_id");