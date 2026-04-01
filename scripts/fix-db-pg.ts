import "dotenv/config";
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Checking columns for quote_requests...");
    
    // Add file_urls if not exists
    try {
      await client.query(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS file_urls text[]`);
      console.log("Added/Checked file_urls column");
    } catch (e) {
      console.error("Error adding file_urls:", e);
    }

    // Add status if not exists
    try {
      await client.query(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`);
      console.log("Added/Checked status column");
    } catch (e) {
      console.error("Error adding status:", e);
    }

    console.log("Current columns:");
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quote_requests'
    `);
    console.table(columns.rows);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
