import { useEffect, useState } from "react";
import api from "../../../api/axios";
import ApproveCoursesView from "./view";

const ApproveCourses = () => {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewModuleId, setPreviewModuleId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewModuleType, setPreviewModuleType] = useState(null);

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    try {
      const res = await api.get("/api/admin/courses/pending");
      setPendingCourses(res.data.courses);
    } catch (err) {
      console.error("Failed to load pending courses", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courses_id) => {
    try {
      const res = await api.get(`/api/courses/${courses_id}/modules`);
      setModules(res.data);
    } catch (err) {
      console.error("Failed to load modules", err);
      setModules([]);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    await fetchModules(course.courses_id);
  };

  const closeDetails = () => {
    setSelectedCourse(null);
    setModules([]);
  };

  const updateStatus = async (courseId, status) => {
    if (!window.confirm(`Are you sure you want to ${status}?`)) return;

    try {
      await api.patch(
        `/api/admin/courses/${courseId}/status`,
        { status }
      );

      setPendingCourses((prev) =>
        prev.filter((c) => c.courses_id !== courseId)
      );

      closeDetails();
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update course status");
    }
  };

  return (
    <ApproveCoursesView
      loading={loading}
      pendingCourses={pendingCourses}
      selectedCourse={selectedCourse}
      setSelectedCourse={selectCourse}
      modules={modules}
      handleAction={updateStatus}
      previewModuleId={previewModuleId}
      setPreviewModuleId={setPreviewModuleId}
      previewUrl={previewUrl}
      setPreviewUrl={setPreviewUrl}
      previewModuleType={previewModuleType}
      setPreviewModuleType={setPreviewModuleType}
    />
  );
};


export default ApproveCourses;
