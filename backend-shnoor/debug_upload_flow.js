import "dotenv/config";
import pool from "./db/postgres.js";
import { bulkUploadCourses } from "./controllers/course.controller.js";

// Mock Request with the EXACT sample data the user likely used
const mockReq = {
    file: {
        buffer: Buffer.from(`course_title,category,level,validity,description,thumbnail_url,pricing_type,module_name,module_type,module_duration,module_source,module_notes
"Debug Python Course","Programming","Beginner",30,"Desc","http://thumb","Free","1. Introduction to Python","text_stream",5,"Welcome to the course! We will cover the basics.","Note"`)
    },
    user: { id: null }
};

const mockRes = {
    statusCode: 200,
    status: function (code) { this.statusCode = code; return this; },
    json: function (data) { console.log("Response:", JSON.stringify(data, null, 2)); }
};

const debugFlow = async () => {
    try {
        console.log("--- STARTING DEBUG FLOW ---");
        const userRes = await pool.query("SELECT user_id FROM users WHERE role = 'instructor' LIMIT 1");
        mockReq.user.id = userRes.rows[0].user_id;

        await bulkUploadCourses(mockReq, mockRes);

        // Check the result
        const modRes = await pool.query("SELECT module_id FROM modules WHERE title = '1. Introduction to Python' ORDER BY created_at DESC LIMIT 1");
        if (modRes.rows.length > 0) {
            const modId = modRes.rows[0].module_id;
            const chunks = await pool.query("SELECT count(*) FROM module_text_chunks WHERE module_id = $1", [modId]);
            console.log(`Chunks created: ${chunks.rows[0].count}`);
        } else {
            console.log("Module not found!");
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await pool.end();
    }
};

debugFlow();
