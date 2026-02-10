import "dotenv/config";
import pool from "./db/postgres.js";
import { bulkUploadCourses } from "./controllers/course.controller.js";
import fs from "fs";

// Mock Request and Response
const mockReq = {
    file: {
        buffer: Buffer.from(`course_title,category,level,validity,description,thumbnail_url,pricing_type,module_name,module_type,module_duration,module_source
"Verification Course","Testing","Beginner",10,"Verification course description","http://thumb.url","Free","Intro","text_stream",5,"Verifying fix"`)
    },
    user: { id: null } // To be filled
};

const mockRes = {
    statusCode: 200,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log(`Response [${this.statusCode}]:`, JSON.stringify(data, null, 2));
    }
};

const verify = async () => {
    try {
        console.log("--- STARTING VERIFICATION ---");

        // 1. Get a valid instructor ID
        const userRes = await pool.query("SELECT user_id FROM users WHERE role = 'instructor' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error("No instructor found.");
            process.exit(1);
        }
        mockReq.user.id = userRes.rows[0].user_id;
        console.log("Using Instructor ID:", mockReq.user.id);

        // 2. Call the controller
        await bulkUploadCourses(mockReq, mockRes);

        // 3. Verify in DB
        const courseCheck = await pool.query("SELECT * FROM courses WHERE title = 'Verification Course'");
        console.log("Course Check Count:", courseCheck.rows.length);
        if (courseCheck.rows.length > 0) {
            const courseId = courseCheck.rows[0].courses_id;
            const moduleCheck = await pool.query("SELECT * FROM modules WHERE course_id = $1", [courseId]);
            console.log("Module Check Count:", moduleCheck.rows.length);
        }

        console.log("--- VERIFICATION FINISHED ---");
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
};

verify();
