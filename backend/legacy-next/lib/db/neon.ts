import "server-only";
import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

const globalNeon = globalThis as typeof globalThis & {
  __sm1SqlClient?: SqlClient;
};

export function getSqlClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  globalNeon.__sm1SqlClient ??= neon(process.env.DATABASE_URL);
  return globalNeon.__sm1SqlClient;
}
