
import "dotenv/config";
import pool from "./db/postgres.js";

const checkAccess = async () => {
    try {
        // hardcode IDs for now based on recent logs or queries if possible, 
        // or query for a known student/course pair.
        // For now, let's list assignments vs student_courses for a sample.

        console.log("--- Checking Perms ---");

        // 1. Get a student and a course they interact with
        const studentRes = await pool.query("SELECT user_id, full_name, email FROM users WHERE role = 'student' LIMIT 1");
        if (studentRes.rows.length === 0) { console.log("No students"); return; }
        const student = studentRes.rows[0];
        console.log("Student:", student);

        // 2. Check course assignments (manual assignment by admin/instructor)
        const assignments = await pool.query("SELECT * FROM course_assignments WHERE student_id = $1", [student.user_id]);
        console.log("Assignments (course_assignments):", assignments.rows);

        // 3. Check student_courses (enrollments/purchases)
        const enrollments = await pool.query("SELECT * FROM student_courses WHERE student_id = $1", [student.user_id]);
        console.log("Enrollments (student_courses):", enrollments.rows);

        // 4. Check logic gap
        // If a student is in student_courses but NOT in course_assignments, 
        // and the controller checks course_assignments, that's the bug.
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkAccess();
