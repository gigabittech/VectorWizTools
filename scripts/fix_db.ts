import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function fixDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Checking and updating email_settings table...");
    
    // Add email_provider column if missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_settings' AND column_name='email_provider') THEN
          ALTER TABLE email_settings ADD COLUMN email_provider TEXT DEFAULT 'brevo' NOT NULL;
          RAISE NOTICE 'Column email_provider added.';
        ELSE
          RAISE NOTICE 'Column email_provider already exists.';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_settings' AND column_name='smtp_pass') THEN
          ALTER TABLE email_settings ADD COLUMN smtp_pass TEXT;
          RAISE NOTICE 'Column smtp_pass added.';
        ELSE
          RAISE NOTICE 'Column smtp_pass already exists.';
        END IF;
      END
      $$;
    `);

    console.log("Database updated successfully!");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await pool.end();
  }
}

fixDb();
