import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost/dummy" });
export const db = drizzle(pool, { schema });
