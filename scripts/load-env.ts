/**
 * Load env for tsx CLI scripts — aligns with Next: `.env.local` overrides `.env`.
 * `@vercel/postgres` expects `POSTGRES_URL`; that usually lives only in `.env.local`.
 */

import { config } from "dotenv";
import path from "node:path";

const root = process.cwd();

config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });
