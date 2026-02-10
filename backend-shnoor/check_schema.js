import "dotenv/config";
import pool from "./db/postgres.js";

const check = async () => {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'link';
    `);
        console.log("Link column exists:", res.rows.length > 0);

        if (res.rows.length === 0) {
            console.log("Attempting adding column...");
            await pool.query(`ALTER TABLE notifications ADD COLUMN link TEXT;`);
            console.log("Column added.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err.message);
        process.exit(1);
    }
};

check();
