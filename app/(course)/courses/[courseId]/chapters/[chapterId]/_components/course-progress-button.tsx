"use client";

import { Button } from "@/components/ui/button";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import axios from "axios";
import { CheckCircle, Icon, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type Props = {
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  /** Practice comes before the next lesson. */
  hasExercises?: boolean;
  isCompleted?: boolean;
};

const CourseEnrollButton = ({
  courseId,
  chapterId,
  nextChapterId,
  hasExercises = false,
  isCompleted,
}: Props) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const Icon = isCompleted ? XCircle : CheckCircle;
  const [isLoading, setIsloading] = useState(false);

  const onClick = async () => {
    try {
      setIsloading(true);

      await axios.put(
        `/api/courses/${courseId}/chapters/${chapterId}/progress`,
        {
          isCompleted: !isCompleted,
        }
      );
      if (!isCompleted && hasExercises) {
        router.push(`/courses/${courseId}/chapters/${chapterId}/exercises`);
        router.refresh();
        return;
      }
      if (!isCompleted && !nextChapterId) {
        confetti.onOpen();
      }
      if (!isCompleted && nextChapterId) {
        router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
      }

      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsloading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className=" w-full md:w-auto"
      type="button"
      variant={isCompleted ? "outline" : "success"}
    >
      {isCompleted ? "غير مكتمل" : "وضع علامة مكتمل"}

      <Icon className=" h-4 w-4 mr-2" />
    </Button>
  );
};

export default CourseEnrollButton;
