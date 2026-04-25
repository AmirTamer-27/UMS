import { useCallback, useEffect, useState } from "react";

import { courseRegistrationService } from "../services/courseRegistration";

export const useAvailableCourses = (profile) => {
  const [data, setData] = useState({
    activeSemester: null,
    student: null,
    offerings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    if (!profile?.id) {
      setData({ activeSemester: null, student: null, offerings: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextData =
        await courseRegistrationService.getAvailableCoursesForStudent(profile);
      setData(nextData);
    } catch (loadError) {
      setError(
        loadError.message || "Unable to load courses for registration right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    ...data,
    error,
    loading,
    refresh: loadCourses,
  };
};
