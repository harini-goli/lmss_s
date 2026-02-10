import pool from "../db/postgres.js";
export const markModuleCompleted = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    const { moduleId } = req.body;

    // 1️⃣ Verify assignment/enrollment
    const accessCheck = await pool.query(
      `SELECT 1 FROM course_assignments WHERE student_id = $1 AND course_id = $2
       UNION
       SELECT 1 FROM student_courses WHERE student_id = $1 AND course_id = $2`,
      [studentId, courseId]
    );

    if (accessCheck.rowCount === 0) {
      return res.status(403).json({
        message: "Not assigned to this course",
      });
    }

    // 2️⃣ Insert progress
    await pool.query(
      `INSERT INTO module_progress (student_id, course_id, module_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, module_id) DO NOTHING`,
      [studentId, courseId, moduleId]
    );

    res.json({ message: "Module marked as completed" });
  } catch (error) {
    console.error("markModuleCompleted error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
