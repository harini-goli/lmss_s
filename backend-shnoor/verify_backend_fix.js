
import "dotenv/config";
import pool from "./db/postgres.js";
import { addModules, deleteModule } from "./controllers/moduleController.js";

// Mock Response
const createMockRes = () => {
    let responseData = null;
    let statusCode = 200;
    return {
        statusCode: 200, // property for read
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            responseData = data;
        },
        getData: () => responseData,
    };
};

const run = async () => {
    try {
        console.log("--- STARTING VERIFICATION ---");

        // 1. Get a valid course and instructor
        const courseRes = await pool.query("SELECT courses_id, instructor_id FROM courses LIMIT 1");
        if (courseRes.rows.length === 0) {
            console.error("No courses found. Cannot verify.");
            process.exit(1);
        }
        const { courses_id, instructor_id } = courseRes.rows[0];
        console.log(`Using Course: ${courses_id}, Instructor: ${instructor_id}`);

        // 2. Add Module (HTML Text Stream)
        const testFileName = "test_html_upload.html";
        // Ensure this URL format matches what the controller expects to parse filename
        const contentUrl = `http://localhost:5000/uploads/${testFileName}`;

        const mockReqAdd = {
            body: {
                courseId: courses_id,
                modules: JSON.stringify([{
                    title: "Verification HTML Stream",
                    type: "text_stream",
                    content_url: contentUrl,
                    duration: 5,
                    order_index: 999
                }])
            },
            files: []
        };

        const mockResAdd = createMockRes();
        await addModules(mockReqAdd, mockResAdd);

        const addData = mockResAdd.getData();
        if (!addData || addData.message !== "Modules added successfully") {
            console.error("Add Module Failed with status:", mockResAdd.statusCode);
            console.error("Response:", addData);
            throw new Error("Add Module Failed");
        }
        console.log("✅ Module Added Successfully");

        // 3. Find the new module ID
        const modRes = await pool.query(
            "SELECT module_id FROM modules WHERE course_id = $1 AND title = 'Verification HTML Stream' ORDER BY created_at DESC LIMIT 1",
            [courses_id]
        );
        if (modRes.rows.length === 0) {
            throw new Error("Could not find created module in DB");
        }
        const moduleId = modRes.rows[0].module_id;
        console.log(`New Module ID: ${moduleId}`);

        // 4. Verify Chunks (HTML Stripping)
        const chunksRes = await pool.query("SELECT * FROM module_text_chunks WHERE module_id = $1 ORDER BY chunk_order ASC", [moduleId]);
        if (chunksRes.rows.length === 0) {
            console.error("❌ No chunks created! HTML stripping failed.");
            // Don't throw yet, let's try to delete cleanup
        } else {
            console.log(`✅ Text chunks created: ${chunksRes.rows.length} chunks`);

            // Check content
            const allContent = chunksRes.rows.map(r => r.content).join("");
            console.log(`Reconstructed Content Start: "${allContent.substring(0, 50)}..."`);

            if (allContent.includes("<body>") || allContent.includes("<p>")) {
                console.error("❌ HTML tags were NOT stripped!");
            } else {
                console.log("✅ HTML tags stripped successfully");
            }
        }

        // 5. Delete Module (Verify SQL Fix)
        const mockReqDel = {
            params: { moduleId },
            user: { id: instructor_id }
        };
        const mockResDel = createMockRes();
        await deleteModule(mockReqDel, mockResDel);

        const delData = mockResDel.getData();
        if (delData && delData.message === "Module deleted successfully") {
            console.log("✅ Module Deleted Successfully");
        } else {
            console.error("❌ Delete Module Failed status:", mockResDel.statusCode);
            console.error("Response:", delData);
            throw new Error("Delete Module Failed");
        }

    } catch (err) {
        console.error("--- VERIFICATION FAILED ---");
        console.error(err);
    } finally {
        await pool.end();
    }
};

run();
