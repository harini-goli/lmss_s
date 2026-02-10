import "dotenv/config";
import pool from "./db/postgres.js";

const migrate = async () => {
    try {
        await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);
        console.log("✅ Added link column to notifications table");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrate();
