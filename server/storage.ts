import { Requirement, InsertRequirement } from "@shared/schema";

export interface IStorage {
  getRequirements(): Promise<Requirement[]>;
}

export class MemStorage implements IStorage {
  async getRequirements(): Promise<Requirement[]> {
    return [];
  }
}

export const storage = new MemStorage();
