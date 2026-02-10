
import "dotenv/config";
import pool from "./db/postgres.js";

const checkUsersSchema = async () => {
    try {
        const res = await pool.query("SELECT * FROM users LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Users Columns:", Object.keys(res.rows[0]));
        } else {
            const schemaRes = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            `);
            console.log("Users Columns (Schema):", schemaRes.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkUsersSchema();
