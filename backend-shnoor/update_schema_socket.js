import "dotenv/config";
import pool from "./db/postgres.js";

const updateSchema = async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();`);
    // Also add 'type' column to notifications as per plan (though not strictly required if we just send message and link, but good for filtering)
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);`);
    
    console.log("Schema updated successfully: users.last_active, notifications.type");
    process.exit(0);
  } catch (err) {
    console.error("Schema update failed:", err);
    process.exit(1);
  }
};

updateSchema();
