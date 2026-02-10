import "dotenv/config";
import fs from 'fs';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import pool from "./db/postgres.js";
import { initializeSocket } from "./services/socket.js";
//import { inactivityCronJob } from "./services/cron.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentCoursesRoutes from "./routes/studentCourses.routes.js";
import examRoutes from "./routes/exam.routes.js";
import studentExamRoutes from "./routes/studentExam.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any localhost origin (for development convenience)
      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use("/uploads", express.static("uploads"));

app.use(express.json());

// DEBUG LOGGER

app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFileSync('server_debug.log', log);

  // Capture response status
  const originalSend = res.send;
  res.send = function (body) {
    const statusLog = `[${new Date().toISOString()}] Response ${res.statusCode} for ${req.url}: ${typeof body === 'object' ? JSON.stringify(body) : body}\n`;
    fs.appendFileSync('server_debug.log', statusLog);
    return originalSend.call(this, body);
  };

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes); // Register upload routes early to avoid conflicts
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", moduleRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentCoursesRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/student/exams", studentExamRoutes);
app.use("/api/student/exams", studentExamRoutes);
// app.use("/api/upload", uploadRoutes); // Moved up

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Log critical errors to file
  const errorLog = `[${new Date().toISOString()}] ${err.stack}\n`;
  fs.appendFileSync('server_errors.log', errorLog);

  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
pool.query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connected successfully");

    // Initialize Socket.IO
    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO ready for connections`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("Please check your database credentials in .env");
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit - just log the error
});
