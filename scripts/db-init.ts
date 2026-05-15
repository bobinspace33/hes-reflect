import "./load-env";
import { getSchemaStatements, sql } from "../src/lib/db";

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error(
      "POSTGRES_URL is not set. Add it to `.env.local` (see README) or run: vercel env pull .env.local",
    );
    process.exit(1);
  }

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
