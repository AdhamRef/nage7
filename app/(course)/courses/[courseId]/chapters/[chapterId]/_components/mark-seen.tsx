"use client";

import axios from "axios";
import { useEffect } from "react";

interface MarkSeenProps {
  courseId: string;
  chapterId: string;
}

/**
 * Pings the server once when a student opens a chapter they can watch, which
 * is what registers them as a student of the course. Never touches the
 * completed flag — only records that they were here.
 */
const MarkSeen = ({ courseId, chapterId }: MarkSeenProps) => {
  useEffect(() => {
    let cancelled = false;

    axios
      .post(`/api/courses/${courseId}/chapters/${chapterId}/seen`)
      .catch(() => {
        // Attendance is best-effort; never interrupt the lesson for it.
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, chapterId]);

  return null;
};

export default MarkSeen;
