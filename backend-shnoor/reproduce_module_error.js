
import "dotenv/config";
import pool from "./db/postgres.js";

import { addModules } from "./controllers/moduleController.js";
import fs from 'fs';

// Mock Request and Response
const mockReq = {
    body: {
        courseId: null, // Will be filled dynamically
        modules: [
            {
                title: "Test Text Stream",
                type: "text_stream",
                content_url: "http://localhost:5000/uploads/test_html_upload.html",
                duration: 5,
                order_index: 1
            }
        ]
    },
    files: [] // Simulate empty files array (JSON request)
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

const run = async () => {
    try {
        console.log("--- STARTING REPRODUCTION SCRIPT ---");

        // 1. Get a valid course ID
        const courseRes = await pool.query("SELECT courses_id FROM courses LIMIT 1");
        if (courseRes.rows.length === 0) {
            console.error("No courses found to test with.");
            process.exit(1);
        }
        mockReq.body.courseId = courseRes.rows[0].courses_id;
        console.log("Using Course ID:", mockReq.body.courseId);

        // 2. Call the controller
        await addModules(mockReq, mockRes);

        console.log("--- SCRIPT FINISHED ---");

    } catch (err) {
        console.error("--- CAUGHT ERROR ---");
        console.error(err);
        fs.writeFileSync('error.log', err.stack || err.toString());
    } finally {
        await pool.end();
    }
};

run();
