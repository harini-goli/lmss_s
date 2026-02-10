import pool from "../db/postgres.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

export const addModules = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    // ✅ SAFE PARSING
    let modules = [];

    if (typeof req.body.modules === "string") {
      modules = JSON.parse(req.body.modules);
    } else if (Array.isArray(req.body.modules)) {
      modules = req.body.modules;
    }

    const pdfFiles = req.files || [];

    if (modules.length === 0) {
      return res.status(200).json({
        message: "Course created without modules",
      });
    }

    // Start Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const pdf = pdfFiles[i] || null;

        /*
         * -----------------------------------------------------------------
         * TYPE: 'text_stream' (New Feature)
         * Expects 'content_url' to be set (uploaded via /api/upload previously).
         * -----------------------------------------------------------------
         */
        console.log(`[DEBUG] Processing module ${i}:`, m);
        console.log(`[DEBUG] Module type: ${m.type}, content_url: ${m.content_url}`);

        if (m.type === 'text_stream') {
          let textContent = "";
          let isExternalOrHtml = m.content_url && (m.content_url.includes("gamma.app"));

          // Pre-check file content to see if it's an iframe wrapper
          if (!isExternalOrHtml && m.content_url) {
            try {
              const __filename = fileURLToPath(import.meta.url);
              const __dirname = path.dirname(__filename);
              let filePath = m.content_url;
              if (filePath.startsWith("http")) {
                const urlObj = new URL(filePath);
                filePath = urlObj.pathname;
              }
              filePath = decodeURIComponent(filePath);
              const fileName = path.basename(filePath);
              const absolutePath = path.join(__dirname, '../uploads', fileName);

              let rawContent = "";
              if (fs.existsSync(absolutePath)) {
                rawContent = fs.readFileSync(absolutePath, 'utf-8');
              } else {
                const legacyPath = path.join(process.cwd(), filePath.replace(/^\/?/, ''));
                if (fs.existsSync(legacyPath)) {
                  rawContent = fs.readFileSync(legacyPath, 'utf-8');
                }
              }

              // If HTML and contains iframe/embed, treat as External/Static
              if ((m.content_url.match(/\.html$/i) || filePath.match(/\.html$/i)) &&
                (rawContent.includes("<iframe") || rawContent.includes("<embed"))) {
                console.log("[TextStream] HTML contains iframe/embed. Treating as static content.");
                isExternalOrHtml = true;
              } else if (m.content_url.match(/\.html$/i) || filePath.match(/\.html$/i)) {
                // It is HTML but no iframe, so we will strip tags
                console.log("[TextStream] Stripping HTML tags from content...");
                textContent = rawContent.replace(/<[^>]*>?/gm, ' ');
                textContent = textContent.replace(/\s+/g, ' ').trim();
              } else {
                // Standard text file
                textContent = rawContent;
              }

            } catch (err) {
              console.error("Error reading file for check:", err);
            }
          }

          console.log(`[DEBUG] isExternalOrHtml: ${isExternalOrHtml}`);

          if (!isExternalOrHtml) {
            // Case A: content_url is provided (Pre-uploaded file) and logic above already loaded textContent
            if (m.content_url && textContent) {
              // Already loaded
            }
            else if (m.content_url) {
              // If we didn't load it above (e.g. error), try again or fail? 
              // We should have loaded it. If not, textContent is empty.
            }
            // Case B: Direct Buffer
            else if (pdf) {
              textContent = pdf.buffer.toString('utf-8');
            }

            if (!textContent) {
              if (isExternalOrHtml) {
                console.log("[TextStream] External/HTML content detected. Generating fallback text.");
                textContent = "This module contains a visual presentation or external document. Please refer to the content area below.";
              } else {
                if (!m.content_url) throw new Error("Text content is empty.");
              }
            }

            if (textContent) {
              // Split by words for granular streaming (Typewriter effect)
              const chunks = textContent.split(/\s+/).filter(c => c.length > 0).map(c => c + " ");

              if (chunks.length === 0) {
                throw new Error("No text content found.");
              }
              console.log(`[TextStream] Generated ${chunks.length} word-chunks for module: ${m.title}`);

              // 1. Insert Module
              const newMod = await client.query(
                `INSERT INTO modules (course_id, title, type, content_url, module_order, duration_mins)
                 VALUES ($1, $2, 'text_stream', $3, $4, $5)
                 RETURNING module_id`,
                [courseId, m.title, m.content_url, m.order_index || i + 1, m.duration || 5]
              );
              const moduleId = newMod.rows[0].module_id;

              // 2. Insert Chunks
              const values = [];
              const placeholders = [];

              for (let k = 0; k < chunks.length; k++) {
                const content = chunks[k];
                const duration = 1;

                values.push(moduleId, content, k, duration);
                const offset = k * 4;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
              }

              const insertQuery = `
                INSERT INTO module_text_chunks (module_id, content, chunk_order, duration_seconds)
                VALUES ${placeholders.join(', ')}
              `;

              await client.query(insertQuery, values);
              continue; // Skip standard insert
            }
          }
        }

        // Standard Modules (Video/PDF or HTML/External TextStream)
        console.log("[DEBUG] Attempting standard insert for:", m.title);
        try {
          await client.query(
            `
          INSERT INTO modules (
            course_id,
            title,
            type,
            content_url,
            duration_mins,
            module_order,
            notes,
            pdf_data,
            pdf_filename,
            pdf_mime
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          `,
            [
              courseId,
              m.title,
              m.type,
              m.content_url,
              m.duration || 0,
              m.order_index || i + 1,
              m.notes || null,
              pdf ? pdf.buffer : null,
              pdf ? pdf.originalname : null,
              pdf ? pdf.mimetype : null,
            ]
          );
          console.log("[DEBUG] Standard insert successful");
        } catch (insertErr) {
          console.error("[DEBUG] Insert Error:", insertErr);
          throw insertErr;
        }
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: "Modules added successfully",
        count: modules.length,
      });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("addModules error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getModulesByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        module_id,
        title,
        type,
        content_url,
        duration_mins,
        module_order,
        notes,
        pdf_filename,
        created_at
      FROM modules
      WHERE course_id = $1
      ORDER BY module_order ASC
      `,
      [courseId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getModulesByCourse error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getModulePdf = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT pdf_data, pdf_filename, pdf_mime
      FROM modules
      WHERE module_id = $1
      `,
      [moduleId]
    );

    if (result.rows.length === 0 || !result.rows[0].pdf_data) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const pdf = result.rows[0];

    res.setHeader("Content-Type", pdf.pdf_mime);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${pdf.pdf_filename}"`
    );

    res.send(pdf.pdf_data);
  } catch (error) {
    console.error("getModulePdf error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const deleteModule = async (req, res) => {
  const { moduleId } = req.params;

  try {
    // 🔐 Check instructor ownership via course
    const ownershipCheck = await pool.query(
      `SELECT m.module_id
       FROM modules m
       JOIN courses c ON m.course_id = c.courses_id
       WHERE m.module_id = $1 AND c.instructor_id = $2`,
      [moduleId, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You are not allowed to delete this module",
      });
    }

    await pool.query(
      `DELETE FROM modules WHERE module_id = $1`,
      [moduleId]
    );

    res.status(200).json({
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("deleteModule error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getModuleStream = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    // 1. Get Progress
    let progress = await pool.query(
      `SELECT current_chunk_index, completed_at FROM module_progress 
       WHERE module_id = $1 AND student_id = $2`,
      [moduleId, studentId]
    );

    let currentIndex = 0;
    let isCompleted = false;

    if (progress.rows.length === 0) {
      // First access, create progress entry
      // Fetch course_id first to avoid subquery issues with UUIDs
      const courseRes = await pool.query(`SELECT course_id FROM modules WHERE module_id = $1`, [moduleId]);

      if (courseRes.rows.length > 0) {
        const courseId = courseRes.rows[0].course_id;
        await pool.query(
          `INSERT INTO module_progress (module_id, student_id, course_id, current_chunk_index, last_accessed_at)
           VALUES ($1, $2, $3, 0, NOW())
           ON CONFLICT (module_id, student_id) DO NOTHING`,
          [moduleId, studentId, courseId]
        );
      } else {
        console.warn(`Module ${moduleId} not found when initializing progress`);
        return res.status(404).json({ message: "Module not found" });
      }
    } else {
      currentIndex = progress.rows[0].current_chunk_index || 0;
      isCompleted = !!progress.rows[0].completed_at;
    }

    // 2. Check Total Chunks
    const chunksRes = await pool.query(
      `SELECT chunk_id, content, chunk_order, duration_seconds 
       FROM module_text_chunks 
       WHERE module_id = $1 
       ORDER BY chunk_order ASC`,
      [moduleId]
    );
    const allChunks = chunksRes.rows;

    if (allChunks.length === 0) {
      return res.status(404).json({ message: "No content found for this module" });
    }

    // 3. If Completed, Return ALL chunks (Review Mode)
    if (isCompleted || currentIndex >= allChunks.length) {
      return res.json({
        completed: true,
        chunks: allChunks
      });
    }

    // 4. Return Accumulated Chunks (Streaming Mode)
    const chunksSoFar = allChunks.slice(0, currentIndex + 1);
    const currentChunk = chunksSoFar[chunksSoFar.length - 1];

    res.json({
      completed: false,
      chunks: chunksSoFar,
      currentChunk: currentChunk,
      index: currentIndex,
      total: allChunks.length
    });

  } catch (err) {
    console.error("getModuleStream error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const advanceModuleStream = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    // 1. Get Current Progress
    const progress = await pool.query(
      `SELECT current_chunk_index FROM module_progress 
       WHERE module_id = $1 AND student_id = $2`,
      [moduleId, studentId]
    );

    if (progress.rows.length === 0) {
      return res.status(400).json({ message: "No progress found. Start the module first." });
    }

    let currentIndex = progress.rows[0].current_chunk_index || 0;

    // 2. Get Total Chunks Count
    const countRes = await pool.query(
      `SELECT COUNT(*) as count FROM module_text_chunks WHERE module_id = $1`,
      [moduleId]
    );
    const totalChunks = parseInt(countRes.rows[0].count);

    // 3. Advance Index
    const nextIndex = currentIndex + 1;

    // 4. Update Progress
    console.log(`[AdvanceStream] Module: ${moduleId}, Student: ${studentId}, NextIndex: ${nextIndex}, Total: ${totalChunks}`);

    if (nextIndex >= totalChunks) {
      // Mark as Completed
      const updateRes = await pool.query(
        `UPDATE module_progress 
         SET current_chunk_index = $1, completed_at = NOW(), last_accessed_at = NOW()
         WHERE module_id = $2 AND student_id = $3
         RETURNING progress_id`,
        [totalChunks, moduleId, studentId]
      );

      if (updateRes.rowCount === 0) {
        console.warn(`[AdvanceStream] No progress record found to update for M:${moduleId} S:${studentId}`);
        return res.status(404).json({ message: "Progress record not found" });
      }

      // Also mark module completion in course_progress if needed (logic might be separate, but good to know)
      res.json({ completed: true, message: "Module completed" });
    } else {
      // Just Advance
      const updateRes = await pool.query(
        `UPDATE module_progress 
         SET current_chunk_index = $1, last_accessed_at = NOW()
         WHERE module_id = $2 AND student_id = $3`,
        [nextIndex, moduleId, studentId]
      );

      if (updateRes.rowCount === 0) {
        console.warn(`[AdvanceStream] No progress record found to update for M:${moduleId} S:${studentId}`);
        return res.status(404).json({ message: "Progress record not found" });
      }

      res.json({ completed: false, nextIndex });
    }

  } catch (err) {
    console.error(`[AdvanceStream Error] Module: ${req.params?.moduleId} User: ${req.user?.id}`, err);
    res.status(500).json({ message: "Server error marking progress" });
  }
};
