import "dotenv/config";
import pool from "./db/postgres.js";

const verify = async () => {
    try {
        const res = await pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;`);
        console.log("--------------------------------");
        console.log("LATEST 5 NOTIFICATIONS IN DB:");
        console.log("--------------------------------");
        console.log(JSON.stringify(res.rows, null, 2));
        console.log("--------------------------------");
        console.log("Total Count:", res.rowCount);

        // Check users to see who is student
        const users = await pool.query(`SELECT user_id, full_name, email, role FROM users WHERE role='student' LIMIT 5`);
        console.log("--------------------------------");
        console.log("SAMPLE STUDENTS:");
        console.log("--------------------------------");
        console.log(JSON.stringify(users.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err.message);
        process.exit(1);
    }
};

verify();
