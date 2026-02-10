import "dotenv/config";
import pool from "./db/postgres.js";
import { bulkUploadCourses } from "./controllers/course.controller.js";

// Mock Request and Response for Verification
const mockReq = {
    file: {
        buffer: Buffer.from(`course_title,category,level,validity,description,thumbnail_url,pricing_type,module_name,module_type,module_duration,module_source
"Text Stream Test Course","Testing","Beginner",10,"Description","http://thumb.url","Free","Raw Text Module","text_stream",5,"This is raw text content"
"Text Stream Test Course","Testing","Beginner",10,"Description","http://thumb.url","Free","Gamma Link Module","text_stream",5,"https://gamma.app/docs/test-presentation"`)
    },
    user: { id: null }
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
        console.log("--- STARTING BULK TEXT STREAM VERIFICATION ---");

        // 1. Get Instructor
        const userRes = await pool.query("SELECT user_id FROM users WHERE role = 'instructor' LIMIT 1");
        if (userRes.rows.length === 0) { console.error("No instructor found."); process.exit(1); }
        mockReq.user.id = userRes.rows[0].user_id;

        // 2. Run Controller
        await bulkUploadCourses(mockReq, mockRes);

        // 3. Verify Database
        const courseRes = await pool.query("SELECT courses_id FROM courses WHERE title = 'Text Stream Test Course' ORDER BY created_at DESC LIMIT 1");
        if (courseRes.rows.length === 0) { console.error("Course not created."); return; }
        const courseId = courseRes.rows[0].courses_id;

        // Verify "Raw Text Module"
        const mod1 = await pool.query("SELECT module_id FROM modules WHERE course_id = $1 AND title = 'Raw Text Module'", [courseId]);
        if (mod1.rows.length > 0) {
            const chunks1 = await pool.query("SELECT count(*) FROM module_text_chunks WHERE module_id = $1", [mod1.rows[0].module_id]);
            console.log(`Raw Text Module Chunks: ${chunks1.rows[0].count} (Expected > 0)`);
        }

        // Verify "Gamma Link Module"
        const mod2 = await pool.query("SELECT module_id FROM modules WHERE course_id = $1 AND title = 'Gamma Link Module'", [courseId]);
        if (mod2.rows.length > 0) {
            const chunks2 = await pool.query("SELECT count(*) FROM module_text_chunks WHERE module_id = $1", [mod2.rows[0].module_id]);
            console.log(`Gamma Link Module Chunks: ${chunks2.rows[0].count} (Expected > 0 fallback)`);
        }

        console.log("--- VERIFICATION FINISHED ---");
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

verify();
