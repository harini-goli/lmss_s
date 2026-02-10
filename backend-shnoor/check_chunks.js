import "dotenv/config";
import pool from "./db/postgres.js";

const checkChunks = async () => {
    try {
        console.log("Checking module chunks...");
        // Get module ID for "Introduction to Python"
        const moduleRes = await pool.query("SELECT module_id, title FROM modules WHERE title = 'Introduction to Python'");

        if (moduleRes.rows.length === 0) {
            console.log("Module 'Introduction to Python' not found.");
            return;
        }

        for (const mod of moduleRes.rows) {
            console.log(`Checking module: ${mod.title} (${mod.module_id})`);
            const chunksRes = await pool.query("SELECT count(*) FROM module_text_chunks WHERE module_id = $1", [mod.module_id]);
            console.log(`- Text Chunks Count: ${chunksRes.rows[0].count}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
};

checkChunks();
