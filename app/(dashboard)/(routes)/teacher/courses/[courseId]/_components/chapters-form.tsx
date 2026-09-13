"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Chapter, Course } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  CHAPTER_KINDS,
  chapterKindHints,
  chapterKindLabels,
} from "@/lib/chapter-kind";
import ChaptersList from "./chapters-list";
import { list } from "postcss";

// Define the interface for the form props
interface ChaptersFormProps {
  initialData: Course & { chapters: Chapter[] };
  courseId: string;
}

const ChaptersForm: React.FC<ChaptersFormProps> = ({
  initialData,
  courseId,
}) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
  };

  const formSchema = z.object({
    title: z.string().min(1),
    kind: z.enum(["LESSON", "QUIZ", "EXAM"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", kind: "LESSON" },
  });

  const { isSubmitting, isValid } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    try {
      // Assuming you have an API endpoint to update the course details
      await axios.post(`/api/courses/${courseId}/chapters`, values);
      toast.success("تم انشاء ");
      setIsCreating(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update the course", error);
      toast.error("حدث خطأ");
    }
  }

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("تم إعادة الترتيب");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${id}`)
  }

  return (
    <div className="relative mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-6">
      {isUpdating && (
        <div className="absolute h-full w-full bg-slate-500/20 top-0 left-0 rounded-md flex items-center justify-center">
          <Loader2 className=" animate-spin h-6 w-6 text-sky-700" />
        </div>
      )}
      <div className="font-medium flex items-center justify-between">
        أجزاء الدرس
        <Button variant="ghost" onClick={toggleCreating}>
          {isCreating ? (
            <>الغاء</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 ml-2" />
              أضف جزء
            </>
          )}
        </Button>
      </div>
      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4 w-full"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>أجزاء الدرس</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="مثال: مقدمة عن الدرس"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    اوصف درسك باختصار وبشكل مفيد
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الجزء</FormLabel>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {CHAPTER_KINDS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => field.onChange(kind)}
                        className={cn(
                          "rounded-lg border p-3 text-right transition",
                          field.value === kind
                            ? "border-brand bg-brand/5"
                            : "hover:border-slate-400 dark:border-slate-800"
                        )}
                      >
                        <span className="block text-sm font-bold">
                          {chapterKindLabels[kind]}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {chapterKindHints[kind]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={!isValid || isSubmitting}>
              إضافة
            </Button>
          </form>
        </Form>
      )}
      {!isCreating && (
        <div
          className={cn(
            " text-sm mt-2",
            !initialData.chapters.length && "text-slate-500 italic"
          )}
        >
          {!initialData.chapters.length && "لسه مفيش أجزاء"}
          <ChaptersList
            onEdit={onEdit}
            onReorder={onReorder}
            items={initialData.chapters || []}
          />
        </div>
      )}
      {!isCreating && (
        <p className="text-xs text-muted-foreground mt-4">
          اسحب و اترك حتي تغير ترتيب الأجزاء
        </p>
      )}
    </div>
  );
};

export default ChaptersForm;
