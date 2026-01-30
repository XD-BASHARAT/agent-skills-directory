import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load env (.env.local then .env)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

function sha256(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  const sql = postgres(DB_URL, { prepare: false });
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const [idx, file] of files.entries()) {
    const id = idx + 1; // numeric id expected by __drizzle_migrations schema
    const hash = sha256(path.join(MIGRATIONS_DIR, file));
    const createdAt = Date.now();
    await sql`
      insert into drizzle.__drizzle_migrations (id, hash, created_at)
      values (${id}, ${hash}, ${createdAt})
      on conflict (id) do nothing;
    `;
    console.log(`seeded ${id} -> ${file}`);
  }

  await sql.end({ timeout: 5 });
  console.log("Done seeding migrations table.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
