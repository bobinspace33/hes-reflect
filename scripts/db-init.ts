import "dotenv/config";
import { sql, SCHEMA_SQL } from "../src/lib/db";

async function main() {
  console.log("Initializing database schema...");
  // @vercel/postgres tagged template doesn't accept arbitrary multi-statement strings well;
  // split and run each statement individually.
  const stmts = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of stmts) {
    await sql.query(stmt);
  }
  console.log(`Applied ${stmts.length} statements.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
