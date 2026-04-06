import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_settings'
    `;
    console.log("Current columns in email_settings:");
    console.table(columns);
  } catch (error) {
    console.error("Column check failed:", error);
  }
}

main();
