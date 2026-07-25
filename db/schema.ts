import { relations, sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const reportStatusPreset = pgEnum("report_status_preset", [
  "available",
  "occupied",
  "broken",
  "missing",
  "other",
]);

export const reportResolution = pgEnum("report_resolution", ["verified", "disputed"]);

export const stations = pgTable("stations", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  phone: text("phone").notNull(),
  website: text("website").notNull(),
  hours: text("hours").notNull(),
  operator: text("operator").notNull(),
  connectorType: text("connector_type"),
  ownerEmail: text("owner_email"),
  precisionFlag: text("precision_flag"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stationId: text("station_id").notNull().references(() => stations.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    statusPreset: reportStatusPreset("status_preset").notNull(),
    connectorType: text("connector_type"),
    customText: varchar("custom_text", { length: 80 }),
    photoUrl: text("photo_url"),
    resolution: reportResolution("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("reports_station_id_idx").on(table.stationId)],
);

export const confirmations = pgTable(
  "confirmations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("confirmations_report_id_idx").on(table.reportId),
    uniqueIndex("confirmations_report_device_unique").on(table.reportId, table.deviceId),
  ],
);

export const flags = pgTable(
  "flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flags_report_id_idx").on(table.reportId),
    uniqueIndex("flags_report_device_unique").on(table.reportId, table.deviceId),
  ],
);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stationId: text("station_id").notNull().references(() => stations.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("ratings_score_range", sql`${table.score} BETWEEN 1 AND 5`),
    index("ratings_station_id_idx").on(table.stationId),
  ],
);

export const deviceTrust = pgTable("device_trust", {
  deviceId: text("device_id").primaryKey(),
  trustScore: real("trust_score").default(1).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stationsRelations = relations(stations, ({ many }) => ({
  reports: many(reports),
  ratings: many(ratings),
}));

export const reportsRelations = relations(reports, ({ many, one }) => ({
  station: one(stations, { fields: [reports.stationId], references: [stations.id] }),
  confirmations: many(confirmations),
  flags: many(flags),
}));

export type Station = typeof stations.$inferSelect;
export type NewStation = typeof stations.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Confirmation = typeof confirmations.$inferSelect;
export type Flag = typeof flags.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type DeviceTrust = typeof deviceTrust.$inferSelect;
