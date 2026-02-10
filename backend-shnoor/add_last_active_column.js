import "dotenv/config";
import pool from "./db/postgres.js";

const migrate = async () => {
    try {
        // Add last_active column to users table if it doesn't exist
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();
        `);

        console.log("✅ Added last_active column to users table");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrate();
