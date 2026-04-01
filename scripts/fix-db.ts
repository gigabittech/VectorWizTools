import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Checking columns for quote_requests...");
    
    // Add file_urls if not exists
    try {
      await sql`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS file_urls text[]`;
      console.log("Added file_urls column (if not existed)");
    } catch (e) {
      console.log("Note: file_urls column check failed or already exists.");
    }

    // Add status if not exists
    try {
      await sql`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`;
      console.log("Added status column (if not existed)");
    } catch (e) {
      console.log("Note: status column check failed or already exists.");
    }

    console.log("Database update attempt complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main();
