import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  has_conflict: boolean("has_conflict").default(false).notNull(),
  project_id: text("project_id").notNull(),
});

export const insertRequirementSchema = createInsertSchema(requirements);
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
