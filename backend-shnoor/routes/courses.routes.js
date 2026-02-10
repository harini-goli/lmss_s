import express from "express";
import {
  addCourse,
  approveCourse,
  getPendingCourses,
  getApprovedCourses,
  getInstructorCourses,
  deleteCourse,
  getApprovedCoursesForInstructor,
  getInstructorCourseStats,
  getCourseById,

  exploreCourses,

  updateCourse,
  bulkUploadCourses
} from "../controllers/course.controller.js";

import uploadCsv from "../middlewares/uploadCsv.js";

import firebaseAuth from "../middlewares/firebaseAuth.js";
import attachUser from "../middlewares/attachUser.js";
import roleGuard from "../middlewares/roleGuard.js";

const router = express.Router();

router.post(
  "/bulk-upload",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  uploadCsv.single("file"),
  bulkUploadCourses
);


router.post(
  "/",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  addCourse
);

router.put(
  "/:courseId",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  updateCourse
);


router.get(
  "/instructor",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  getInstructorCourses
);


router.get(
  "/pending",
  firebaseAuth,
  attachUser,
  roleGuard("admin"),
  getPendingCourses
);


router.patch(
  "/:courseId/approve",
  firebaseAuth,
  attachUser,
  roleGuard("admin"),
  approveCourse
);


router.get(
  "/approved",
  firebaseAuth,
  attachUser,
  roleGuard("admin"),
  getApprovedCourses
);

router.delete(
  "/:courseId",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  deleteCourse
);

router.get(
  "/instructor/approved",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  getApprovedCoursesForInstructor
);

router.get(
  "/instructor/stats",
  firebaseAuth,
  attachUser,
  roleGuard("instructor"),
  getInstructorCourseStats
);

router.get(
  "/explore",
  firebaseAuth,
  attachUser,
  exploreCourses
);

router.get(
  "/:courseId",
  firebaseAuth,
  attachUser,
  getCourseById
);


export default router;
