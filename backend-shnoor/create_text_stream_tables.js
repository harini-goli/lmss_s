import pool from "./db/postgres.js";
import fs from "fs";

// Force config just in case env is not loaded in this script
if (!pool.options) pool.options = {};

// We can just use the pool if app.js is running, but for a standalone script, we might need manual config if env issues persist.
// Assuming env is fine or we use the debugPool approach if needed.
// For now, let's try standard pool which relies on .env.
// If it fails, I'll fallback to hardcoded like debug script.

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log("🚀 Starting Text Stream Migration...");

        await client.query("BEGIN");

        // 1. Create module_text_chunks table
        console.log("Creating table: module_text_chunks...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS module_text_chunks (
        chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        chunk_order INT NOT NULL,
        duration_seconds INT DEFAULT 60,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // 2. Add current_chunk_index to module_progress
        console.log("Updating table: module_progress...");
        // Check if column exists first to avoid error
        const checkCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='module_progress' AND column_name='current_chunk_index';
    `);

        if (checkCol.rows.length === 0) {
            await client.query(`
            ALTER TABLE module_progress
            ADD COLUMN current_chunk_index INT DEFAULT 0;
        `);
            console.log("✅ Added current_chunk_index to module_progress");
        } else {
            console.log("ℹ️  current_chunk_index already exists");
        }

        await client.query("COMMIT");
        console.log("✅ Migration completed successfully!");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Migration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
};

runMigration();
