import pool from "../db/postgres.js";
import { sendInstructorInvite } from "../services/email.service.js";
import { emitNotificationToUser } from "../services/socket.js";
export const getDashboardStats = async (req, res) => {
  try {
    const studentsResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'student'",
    );
    const instructorsResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'instructor'",
    );
    const pendingCoursesResult = await pool.query(
      "SELECT COUNT(*) FROM courses WHERE status = 'pending'",
    );
    res.status(200).json({
      totalStudents: Number(studentsResult.rows[0].count),
      totalInstructors: Number(instructorsResult.rows[0].count),
      pendingCourses: Number(pendingCoursesResult.rows[0].count),
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name AS name, email
FROM users
WHERE role IN ('student', 'user')
ORDER BY created_at DESC;
`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const assignCourses = async (req, res) => {
  const { studentIds, courseIds } = req.body;

  if (!studentIds?.length || !courseIds?.length) {
    return res.status(400).json({
      message: "studentIds and courseIds are required",
    });
  }

  try {
    // Assign courses
    const query = `
      INSERT INTO course_assignments (student_id, course_id)
      SELECT s_id, c_id
      FROM UNNEST($1::uuid[]) AS s_id
      CROSS JOIN UNNEST($2::uuid[]) AS c_id
      ON CONFLICT DO NOTHING;
    `;

    await pool.query(query, [studentIds, courseIds]);

    // Fetch course titles once for notifications
    const coursesRes = await pool.query(
      `SELECT courses_id, title FROM courses WHERE courses_id = ANY($1::uuid[])`,
      [courseIds]
    );
    const courseTitleById = new Map(
      coursesRes.rows.map((c) => [c.courses_id, c.title])
    );

    // Create notifications and send emails to students
    console.log("Starting notification creation for students:", studentIds);

    for (const studentId of studentIds) {
      try {
        // Fetch student email and name from database
        const studentResult = await pool.query(
          `SELECT email, full_name FROM users WHERE user_id = $1`,
          [studentId]
        );

        if (studentResult.rows.length > 0) {
          const { email, full_name } = studentResult.rows[0];

          // Create notification and log the inserted row
          for (const courseId of courseIds) {
            try {
              const courseTitle = courseTitleById.get(courseId) || "a new course";
              const message = `🎓 New course assigned: ${courseTitle}. Enroll now.`;

              const notifRes = await pool.query(
                `INSERT INTO notifications (user_id, message, link)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [studentId, message, `/student/course/${courseId}`]
              );
              console.log(
                `Notification created for student ${studentId} (course ${courseId}):`,
                notifRes.rows[0]
              );

              // 🚀 EMIT REAL-TIME SOCKET NOTIFICATION
              emitNotificationToUser(studentId, {
                id: notifRes.rows[0].id,
                message: message,
                link: `/student/course/${courseId}`,
                type: "COURSE_ASSIGNED",
                is_read: false,
                created_at: notifRes.rows[0].created_at,
              });
            } catch (insertErr) {
              console.error(
                `Failed to insert notification for ${studentId} (course ${courseId}):`,
                insertErr
              );
            }
          }

          // Send email to student (non-blocking)
          try {
            await sendInstructorInvite(email, full_name);
            console.log(`Email sent to student ${studentId} (${email})`);
          } catch (mailError) {
            console.error(`Failed to send email to ${email}:`, mailError);
          }
        } else {
          console.warn(`assignCourses: student not found for id ${studentId}`);
        }
      } catch (notifError) {
        console.error(
          `Failed to process student ${studentId}:`,
          notifError
        );
      }
    }

    res.status(200).json({
      message: "Courses assigned successfully",
    });
  } catch (error) {
    console.error("Assign courses error:", error);
    res.status(500).json({ message: "Failed to assign courses" });
  }
};


export const updateCourseStatus = async (req, res) => {
  const { courses_id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["approved", "rejected", "pending"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid status value",
    });
  }

  try {
    // ✅ Check if course exists
    const courseCheck = await pool.query(
      `SELECT courses_id FROM courses WHERE courses_id = $1`,
      [courses_id],
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // ✅ Update course status
    const result = await pool.query(
      `UPDATE courses
       SET status = $1
       WHERE courses_id = $2
       RETURNING courses_id, title, status`,
      [status, courses_id],
    );

    res.status(200).json({
      message: `Course ${status} successfully`,
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Update course status error:", error);
    res.status(500).json({
      message: "Failed to update course status",
    });
  }
};

// Debug: fetch notifications for a specific user (admin only)
export const getNotificationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('getNotificationsForUser error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications for user' });
  }
};

export const getCoursesByStatus = async (req, res) => {
  const { status } = req.query;

  const allowedStatuses = ["pending", "approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid or missing status",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        c.courses_id,
        c.title,
        c.description,
        c.category,
        c.status,
        c.created_at,
        u.full_name AS instructor_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      WHERE c.status = $1
      ORDER BY c.created_at DESC
      `,
      [status],
    );

    res.status(200).json({
      courses: result.rows,
    });
  } catch (error) {
    console.error("getCoursesByStatus error:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

export const getPendingCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
  c.courses_id,
  c.title,
  c.description,
  c.category,
  c.status,
  c.created_at,
  u.full_name AS instructor_name
FROM courses c
JOIN users u ON c.instructor_id = u.user_id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC`,
    );

    res.status(200).json({
      courses: result.rows,
    });
  } catch (error) {
    console.error("Get pending courses error:", error);
    res.status(500).json({
      message: "Failed to fetch pending courses",
    });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT role, status FROM users WHERE user_id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be approved here",
      });
    }

    if (user.status === "active") {
      return res.status(400).json({
        message: "User is already approved",
      });
    }

    if (user.status === "blocked" || user.status === "rejected") {
      return res.status(400).json({
        message: "User cannot be approved",
      });
    }

    const updatedUser = await pool.query(
      `UPDATE users
       SET status = 'active'
       WHERE user_id = $1
       RETURNING user_id, role, status`,
      [userId],
    );

    res.json({
      message: "User approved successfully",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error("approveUser error:", error);
    res.status(500).json({
      message: "Failed to approve user",
    });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         user_id,
         full_name,
         email,
         role,
         status,
         created_at
       FROM users
       WHERE status = 'pending'
       ORDER BY created_at DESC`,
    );

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("getPendingUsers error:", error);
    res.status(500).json({
      message: "Failed to fetch pending users",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'active' | 'blocked'

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET status = $1
      WHERE user_id = $2
      `,
      [status, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({ message: `User ${status} successfully` });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
