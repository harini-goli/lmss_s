import "dotenv/config";
import pool from "./db/postgres.js";

const setup = async () => {
    try {
        // Drop if exists to be clean (optional, but safer to start fresh if it was half-baked)
        // await pool.query(`DROP TABLE IF EXISTS notifications`);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL, -- Assuming UUID based on users table, checking...
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        link TEXT -- Adding link column directly
      );
    `);

        // Check if link exists (in case table already existed but without link)
        const res = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'link';
    `);

        if (res.rows.length === 0) {
            await pool.query(`ALTER TABLE notifications ADD COLUMN link TEXT;`);
            console.log("Added link column.");
        }

        console.log("✅ Notifications table setup complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Setup failed:", err.message);
        process.exit(1);
    }
};

setup();
