import "dotenv/config";
import { getSchemaStatements, sql } from "../src/lib/db";

async function main() {
  console.log("Initializing database schema...");
  const stmts = getSchemaStatements();
  for (const stmt of stmts) {
    await sql.query(stmt);
  }
  console.log(`Applied ${stmts.length} statements.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
