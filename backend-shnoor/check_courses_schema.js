
import "dotenv/config";
import pool from "./db/postgres.js";

const checkSchema = async () => {
    try {
        console.log("Checking courses table schema...");
        const res = await pool.query("SELECT * FROM courses LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Columns:", Object.keys(res.rows[0]));
        } else {
            console.log("Table exists but is empty. Getting column info from information_schema...");
            const schemaRes = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'courses'
            `);
            console.log("Columns:", schemaRes.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkSchema();
