"use client";

import ConfirmModal from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

// Define the interface for the form props
interface ChapterActionsProps {
  disabled: boolean;
  courseId: string;
  chapterId: string;
  isPublished: boolean;
}

const ChapterActionsForm: React.FC<ChapterActionsProps> = ({
  disabled,
  courseId,
  chapterId,
  isPublished,
}: ChapterActionsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const onDelete = async () => {
      try{
          setIsLoading(true)
          await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}`)
          toast.success("تم مسح الجزء")
          router.refresh()
          router.push(`/teacher/courses/${courseId}`)
      }catch{
          toast.error("حدث خطأ")
      }finally{
          setIsLoading(false)
      }
  }
  
  const onClick = async () => {
      try{
          setIsLoading(true)
          if(isPublished){
            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/unpublish`)
            toast.success("تم اِخفاء الجزء عن العامة")
          }else{
            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/publish`)
            toast.success("تم اِظهار الجزء للعامة")
          }
          
          router.refresh()
      }catch{
          toast.error("حدث خطأ")
      }finally{
          setIsLoading(false)
      }
  }
  
  return (
    <div className="flex items-center gap-x-2">
      <Button
        className="font-semibold"
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
      >
        {isPublished ? "إخفاء" : "نشر"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};

export default ChapterActionsForm;
