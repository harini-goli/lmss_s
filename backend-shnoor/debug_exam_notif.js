import pool from "./db/postgres.js";

// Force config for debug script only - bypassing .env loading issues
if (!pool.options) pool.options = {};
const config = {
    host: 'localhost',
    port: 5432,
    database: 'lms_dbbb',
    user: 'postgres',
    password: 'H@2425',
};

// Manually creating a new pool for this script to be sure
import pkg from "pg";
const { Pool } = pkg;
const debugPool = new Pool(config);

const debugSchema = async () => {
    try {
        console.log("--- DEBUGGING MODULES SCHEMA ---");

        const modulesRes = await debugPool.query(`SELECT * FROM modules LIMIT 1`);
        if (modulesRes.rows.length > 0) {
            console.log("Modules Table Columns:", Object.keys(modulesRes.rows[0]));
        } else {
            console.log("Modules table is empty.");
        }

        const progressRes = await debugPool.query(`SELECT * FROM module_progress LIMIT 1`);
        if (progressRes.rows.length > 0) {
            console.log("Module Progress Columns:", Object.keys(progressRes.rows[0]));
        } else {
            console.log("Module Progress table is empty.");
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        debugPool.end();
    }
};

debugSchema();
