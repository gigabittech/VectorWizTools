import "dotenv/config";
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Checking columns for email_settings...");
    
    // Add missing columns
    const columns = [
      "ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS smtp_user text",
      "ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS smtp_pass text",
      "ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS encryption text NOT NULL DEFAULT 'tls'"
    ];

    for (const sql of columns) {
      try {
        await client.query(sql);
        console.log("Checked:", sql);
      } catch (e) {
        console.error("Error running query:", sql, e);
      }
    }

    console.log("Current columns in email_settings:");
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_settings'
    `);
    console.table(res.rows);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
