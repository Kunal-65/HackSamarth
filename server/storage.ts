import { requirements, type Requirement, type InsertRequirement } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getRequirements(projectId: string): Promise<Requirement[]>;
  addRequirement(req: InsertRequirement): Promise<Requirement>;
  updateRequirement(id: number, updates: Partial<InsertRequirement>): Promise<Requirement>;
  clearRequirements(projectId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getRequirements(projectId: string): Promise<Requirement[]> {
    return await db.select().from(requirements).where(eq(requirements.project_id, projectId));
  }

  async addRequirement(req: InsertRequirement): Promise<Requirement> {
    const [inserted] = await db.insert(requirements).values(req).returning();
    return inserted;
  }

  async updateRequirement(id: number, updates: Partial<InsertRequirement>): Promise<Requirement> {
    const [updated] = await db.update(requirements).set(updates).where(eq(requirements.id, id)).returning();
    return updated;
  }

  async clearRequirements(projectId: string): Promise<void> {
    await db.delete(requirements).where(eq(requirements.project_id, projectId));
  }
}

export const storage = new DatabaseStorage();
