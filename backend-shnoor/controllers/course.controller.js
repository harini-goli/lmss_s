import pool from "../db/postgres.js";
import csv from "csv-parser";
import { Readable } from "stream";


export const addCourse = async (req, res) => {
  const {
    title,
    description,
    category,
    thumbnail_url,
    difficulty,
    status,
    validity_value,
    validity_unit,
    is_paid, // From frontend
    price,   // From frontend
  } = req.body;

  const instructor_id = req.user.id;

  // LOGGING FOR DEBUGGING
  console.log("FULL BODY:", JSON.stringify(req.body));
  console.log("addCourse Payload:", { title, is_paid, price, typeOfIsPaid: typeof is_paid });

  // Robust boolean conversion
  const isPaidBool = is_paid === true || is_paid === "true";
  const priceValue = isPaidBool && price ? Number(price) : 0;

  try {
    let expiresAt = null;

    if (validity_value && validity_unit) {
      if (validity_unit === "days") {
        expiresAt = `NOW() + INTERVAL '${validity_value} days'`;
      } else if (validity_unit === "months") {
        expiresAt = `NOW() + INTERVAL '${validity_value} months'`;
      } else if (validity_unit === "years") {
        expiresAt = `NOW() + INTERVAL '${validity_value} years'`;
      }
    }

    const query = `
      INSERT INTO courses
      (
        instructor_id,
        title,
        description,
        category,
        thumbnail_url,
        difficulty,
        status,
        validity_value,
        validity_unit,
        expires_at,
        pricing_type,
        price_inr
      )
      VALUES
      (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        ${expiresAt ? expiresAt : "NULL"},
        $10, $11
      )
      RETURNING *
    `;

    const values = [
      instructor_id,
      title,
      description,
      category,
      thumbnail_url || null,
      difficulty || null,
      status === "pending" ? "pending" : "draft",
      validity_value || null,
      validity_unit || null,
      isPaidBool ? "paid" : "free",
      priceValue, // Use processed price
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Course created with validity",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("addCourse error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const {
    title,
    description,
    category,
    thumbnail_url,
    difficulty,
    status,
    validity_value,
    validity_unit,
    is_paid,
    price,
  } = req.body;

  const instructor_id = req.user.id;

  // LOGGING
  console.log("updateCourse Payload:", { courseId, is_paid, price, typeOfIsPaid: typeof is_paid });
  const isPaidBool = is_paid === true || is_paid === "true";
  const priceValue = isPaidBool && price ? Number(price) : 0;

  try {
    /* 🔐 CHECK OWNERSHIP */
    const courseCheck = await pool.query(
      "SELECT courses_id FROM courses WHERE courses_id = $1 AND instructor_id = $2",
      [courseId, instructor_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You are not allowed to update this course",
      });
    }

    let expiresAt = null;
    if (validity_value && validity_unit) {
      if (validity_unit === "days") {
        expiresAt = `NOW() + INTERVAL '${validity_value} days'`;
      } else if (validity_unit === "months") {
        expiresAt = `NOW() + INTERVAL '${validity_value} months'`;
      } else if (validity_unit === "years") {
        expiresAt = `NOW() + INTERVAL '${validity_value} years'`;
      }
    }

    const query = `
      UPDATE courses
      SET
        title = $1,
        description = $2,
        category = $3,
        thumbnail_url = $4,
        difficulty = $5,
        status = $6,
        validity_value = $7,
        validity_unit = $8,
        expires_at = ${expiresAt ? expiresAt : "NULL"},
        pricing_type = $9,
        price_inr = $10
      WHERE courses_id = $11
      RETURNING *
    `;

    const values = [
      title,
      description,
      category,
      thumbnail_url || null,
      difficulty || null,
      status === "pending" ? "pending" : "draft",
      validity_value || null,
      validity_unit || null,
      isPaidBool ? "paid" : "free",
      priceValue,
      courseId
    ];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: "Course updated successfully",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("updateCourse error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getInstructorCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `
  SELECT
    c.courses_id,
    c.title,
    c.description,
    c.category,
    c.status,
    c.pricing_type,
    c.price_inr,
    CASE WHEN c.pricing_type = 'paid' THEN true ELSE false END AS is_paid,
    c.price_inr AS price,
    c.difficulty,
    c.created_at,
    COALESCE(
      json_agg(
        json_build_object(
          'module_id', m.module_id,
          'title', m.title,
          'type', m.type,
          'duration', m.duration_mins,
          'order', m.module_order,
          'content_url', m.content_url
        )
        ORDER BY m.module_order
      ) FILTER (WHERE m.module_id IS NOT NULL),
      '[]'
    ) AS modules
  FROM courses c
  LEFT JOIN modules m ON m.course_id = c.courses_id
  WHERE c.instructor_id = $1
  GROUP BY c.courses_id
  ORDER BY c.created_at DESC
  `,
      [req.user.id],
    );

    console.log("getInstructorCourses First Row:", result.rows[0]); // DEBUG LOG
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getInstructorCourses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPendingCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS instructor_name
       FROM courses c
       JOIN users u ON c.instructor_id = u.user_id
       WHERE c.status = 'pending'
       ORDER BY c.created_at DESC`,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getPendingCourses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveCourse = async (req, res) => {
  const { courseId } = req.params;
  const { status } = req.body; // approved | rejected

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status value",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE courses
       SET status = $1
       WHERE courses_id = $2
       RETURNING *`,
      [status, courseId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      message: `Course ${status} successfully`,
      course: result.rows[0],
    });
  } catch (error) {
    console.error("approveCourse error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getApprovedCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS instructor_name
       FROM courses c
       JOIN users u ON c.instructor_id = u.user_id
       WHERE c.status = 'approved'
       ORDER BY c.created_at DESC`,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getApprovedCourses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCourse = async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  try {
    /* 🔐 CHECK OWNERSHIP */
    const courseCheck = await pool.query(
      `
      SELECT courses_id
      FROM courses
      WHERE courses_id = $1 AND instructor_id = $2
      `,
      [courseId, req.user.id],
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You are not allowed to delete this course",
      });
    }

    /* 🧹 DELETE DEPENDENT DATA */
    await pool.query(`DELETE FROM modules WHERE course_id = $1`, [courseId]);

    await pool.query(`DELETE FROM course_assignments WHERE course_id = $1`, [
      courseId,
    ]);

    /* 🗑 DELETE COURSE */
    await pool.query(`DELETE FROM courses WHERE courses_id = $1`, [courseId]);

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("deleteCourse error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getApprovedCoursesForInstructor = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const result = await pool.query(
      `
      SELECT c.courses_id, c.title
      FROM courses c
      WHERE c.status = 'approved'
        AND c.instructor_id = $1
      ORDER BY c.created_at DESC
      `,
      [instructorId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getApprovedCoursesForInstructor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorCourseStats = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_courses
      FROM courses
      WHERE instructor_id = $1
      `,
      [instructorId],
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Instructor course stats error:", err);
    res.status(500).json({ message: "Failed to fetch course stats" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        c.courses_id,
        c.title,
        c.description,
        c.category,
        c.pricing_type,
        c.price_inr,
        c.difficulty AS level,        -- 👈 FIX LEVEL
        c.created_at AS updatedAt, 

        json_build_object(            -- 👈 FIX INSTRUCTOR
          'name', u.full_name,
          'email', u.email
        ) AS instructor

      FROM courses c
      LEFT JOIN users u
        ON u.user_id = c.instructor_id

      WHERE c.courses_id = $1
      `,
      [courseId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getCourseById error:", err);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

export const exploreCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT
        c.courses_id,
        c.title,
        c.description,
        c.category,
        c.difficulty AS level,
        u.full_name AS instructorName,
        c.pricing_type,
        c.price_inr,
        CASE WHEN c.pricing_type = 'paid' THEN true ELSE false END AS is_paid,
        c.price_inr AS price
      FROM courses c
      LEFT JOIN users u ON u.user_id = c.instructor_id
      WHERE c.courses_id NOT IN (
        SELECT course_id
        FROM student_courses
        WHERE student_id = $1
      )
      ORDER BY c.created_at DESC
      `,
      [studentId],
    );

    console.log("exploreCourses First Row:", rows[0]); // DEBUG LOG
    res.json(rows);
  } catch (err) {
    console.error("Explore courses error:", err);
    res.status(500).json({ message: "Failed to load explore courses" });
  }
};
export const bulkUploadCourses = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  const results = [];
  const errors = [];
  let successCount = 0;

  try {
    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString("utf-8"));

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("error", (err) => reject(err))
        .on("end", async () => {
          try {
            if (results.length === 0) {
              return reject(new Error("CSV file is empty"));
            }

            // Group by course_title
            const coursesMap = {};

            results.forEach((row, index) => {
              const courseTitle = row.course_title?.trim();
              if (!courseTitle) {
                errors.push({ row: index + 2, message: "Missing course_title" });
                return;
              }

              if (!coursesMap[courseTitle]) {
                coursesMap[courseTitle] = {
                  details: {
                    title: courseTitle,
                    category: row.category,
                    level: row.level,
                    validity: row.validity,
                    description: row.description,
                    thumbnail_url: row.thumbnail_url,
                    pricing_type: row.pricing_type,
                  },
                  modules: [],
                };
              }

              if (row.module_name) {
                coursesMap[courseTitle].modules.push({
                  title: row.module_name,
                  type: row.module_type,
                  duration: row.module_duration,
                  content_url: row.module_source,
                  notes: row.module_notes,
                });
              }
            });

            const client = await pool.connect();
            try {
              for (const courseTitle in coursesMap) {
                const courseData = coursesMap[courseTitle];
                const details = courseData.details;

                await client.query("BEGIN");
                try {
                  const isPaid = details.pricing_type?.toLowerCase() === "paid";
                  let difficulty = details.level || "Beginner";
                  difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
                  if (!["Beginner", "Intermediate", "Advanced"].includes(difficulty)) {
                    difficulty = "Beginner";
                  }

                  let validityValue = details.validity ? parseInt(details.validity) : null;
                  let validityUnit = 'days';

                  // Safe interval construction
                  const expiresAtFragment = validityValue ? `NOW() + INTERVAL '${validityValue} days'` : "NULL";

                  const insertCourseQuery = `
                    INSERT INTO courses (
                      instructor_id, title, description, category, thumbnail_url, 
                      difficulty, status, validity_value, validity_unit, expires_at, 
                      pricing_type, price_inr
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${expiresAtFragment}, $10, $11)
                    RETURNING courses_id
                  `;

                  const courseRes = await client.query(insertCourseQuery, [
                    req.user.id,
                    details.title,
                    details.description,
                    details.category,
                    details.thumbnail_url,
                    difficulty,
                    "pending",
                    validityValue,
                    validityUnit,
                    isPaid ? "paid" : "free",
                    0
                  ]);

                  const courseId = courseRes.rows[0].courses_id;

                  for (let i = 0; i < courseData.modules.length; i++) {
                    const mod = courseData.modules[i];
                    let type = mod.type?.toLowerCase();
                    if (!['video', 'pdf', 'text_stream'].includes(type)) type = 'video';

                    let moduleId;

                    if (type === 'text_stream') {
                      // Text Stream Handling
                      let textContent = mod.content_url || "";
                      const isUrl = textContent.match(/^https?:\/\//i);

                      if (isUrl) {
                        // If it's a URL (Gamma, HTML, etc.), use fallback text for the stream
                        textContent = "This module contains a visual presentation or external document. Please refer to the content area below.";
                      }

                      // Split into chunks (simple space-based split for typewriter effect)
                      const chunks = textContent.split(/\s+/).filter(c => c.length > 0).map(c => c + " ");

                      const modRes = await client.query(
                        `INSERT INTO modules (course_id, title, type, content_url, duration_mins, module_order, notes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)
                         RETURNING module_id`,
                        [
                          courseId,
                          mod.title,
                          type,
                          mod.content_url, // Keep original URL/Content in module record
                          mod.duration ? parseInt(mod.duration) : 0,
                          i + 1,
                          mod.notes || null
                        ]
                      );
                      moduleId = modRes.rows[0].module_id;

                      if (chunks.length > 0) {
                        const values = [];
                        const placeholders = [];
                        for (let k = 0; k < chunks.length; k++) {
                          values.push(moduleId, chunks[k], k, 1); // 1 sec duration per chunk
                          const offset = k * 4;
                          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
                        }

                        const insertChunkQuery = `
                          INSERT INTO module_text_chunks (module_id, content, chunk_order, duration_seconds)
                          VALUES ${placeholders.join(', ')}
                        `;
                        await client.query(insertChunkQuery, values);
                      }

                    } else {
                      // Standard Video/PDF Handling
                      await client.query(
                        `INSERT INTO modules (course_id, title, type, content_url, duration_mins, module_order, notes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                          courseId,
                          mod.title,
                          type,
                          mod.content_url,
                          mod.duration ? parseInt(mod.duration) : 0,
                          i + 1,
                          mod.notes || null
                        ]
                      );
                    }
                  }

                  await client.query("COMMIT");
                  successCount++;
                } catch (err) {
                  await client.query("ROLLBACK");
                  console.error(`Error creating course ${courseTitle}:`, err);
                  errors.push({ course: courseTitle, message: err.message });
                }
              }
            } finally {
              client.release();
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
    });

    res.json({
      message: "Bulk upload processed",
      successCount,
      errors,
    });

  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(err.message === "CSV file is empty" ? 400 : 500).json({
      message: err.message || "Server error during bulk upload"
    });
  }
};
