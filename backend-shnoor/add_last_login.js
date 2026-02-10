import "dotenv/config";
import pool from "./db/postgres.js";

const migrate = async () => {
    try {
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT NOW();
    `);
        console.log("✅ Added last_login column successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrate();
