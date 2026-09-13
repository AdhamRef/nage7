"use client";

import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { Exercise } from "@prisma/client";
import axios from "axios";
import {
  Code2,
  FileCode2,
  Grip,
  HelpCircle,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ExerciseWizard from "./exercise-wizard";

interface ChapterExercisesFormProps {
  initialData: Exercise[];
  courseId: string;
  chapterId: string;
}

const ChapterExercisesForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterExercisesFormProps) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [exercises, setExercises] = useState(initialData);
  const [isReordering, setIsReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  // The drag library can't render on the server.
  useEffect(() => setIsMounted(true), []);
  useEffect(() => setExercises(initialData), [initialData]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(exercises);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setExercises(items);

    setIsReordering(true);
    try {
      await axios.put(
        `/api/courses/${courseId}/chapters/${chapterId}/exercises/reorder`,
        {
          list: items.map((item, index) => ({ id: item.id, position: index })),
        }
      );
      toast.success("تم تغيير الترتيب");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
      setExercises(initialData);
    } finally {
      setIsReordering(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/exercises/${id}`
      );
      toast.success("تم حذف التمرين");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setDeletingId(null);
    }
  };

  const openWizard = (exercise: Exercise | null) => {
    setEditing(exercise);
    setWizardOpen(true);
  };

  return (
    <div className="relative mt-6 rounded-md border bg-slate-100 p-6 dark:bg-slate-900">
      {isReordering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-slate-500/20">
          <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
        </div>
      )}

      <div className="flex items-center justify-between font-medium">
        تمارين الجزء
        <Button variant="ghost" onClick={() => openWizard(null)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          أضف تمرين
        </Button>
      </div>

      {exercises.length === 0 ? (
        <p className="mt-2 text-sm italic text-slate-500">
          لسه مفيش تمارين. كل تمرين هيظهر للطالب كبند لوحده تحت الجزء.
        </p>
      ) : (
        isMounted && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="exercises">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-4 space-y-2"
                >
                  {exercises.map((exercise, index) => (
                    <Draggable
                      key={exercise.id}
                      draggableId={exercise.id}
                      index={index}
                    >
                      {(draggable) => (
                        <div
                          ref={draggable.innerRef}
                          {...draggable.draggableProps}
                          className="flex items-center gap-x-2 rounded-md border bg-white text-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div
                            {...draggable.dragHandleProps}
                            className="cursor-grab rounded-r-md border-l px-2 py-3 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
                          >
                            <Grip className="h-4 w-4" />
                          </div>

                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                              exercise.type === "MCQ"
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
                                : exercise.language === "PYTHON"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            )}
                          >
                            {exercise.type === "MCQ" ? (
                              <HelpCircle className="h-4 w-4" />
                            ) : exercise.language === "PYTHON" ? (
                              <FileCode2 className="h-4 w-4" />
                            ) : (
                              <Code2 className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1 truncate py-3 font-medium">
                            {exercise.question}
                          </span>

                          <div className="flex items-center gap-x-1 pl-2">
                            <button
                              type="button"
                              onClick={() => openWizard(exercise)}
                              className="rounded p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                              aria-label="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(exercise.id)}
                              disabled={deletingId === exercise.id}
                              className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                              aria-label="حذف"
                            >
                              {deletingId === exercise.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )
      )}

      {exercises.length > 1 && (
        <p className="mt-4 text-xs text-muted-foreground">
          اسحب التمارين لتغيير ترتيبها.
        </p>
      )}

      <ExerciseWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        courseId={courseId}
        chapterId={chapterId}
        exercise={editing}
      />
    </div>
  );
};

export default ChapterExercisesForm;
