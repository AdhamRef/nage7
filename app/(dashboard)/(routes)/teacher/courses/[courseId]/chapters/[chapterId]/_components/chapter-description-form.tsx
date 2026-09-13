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
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Chapter, Course } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";

// Define the interface for the form props
interface ChapterDescriptionFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

const ChapterDescriptionForm: React.FC<ChapterDescriptionFormProps> = ({ initialData, courseId, chapterId }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const formSchema = z.object({
    description: z.string().min(1, {
      message: "الوصف مطلوب",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: initialData?.description || "" },
  });

  const { isSubmitting, isValid } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    try {
      // Assuming you have an API endpoint to update the course details
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values);
      toast.success("تم تحديث معلومات الجزء");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update the course", error);
      toast.error("حدث خطأ");
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-6">
      <div className="font-medium flex items-center justify-between">
        وصف الجزء
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing ? (
            <>الغاء</>
          ) : (
            <>
              <Pencil className="h-4 w-4 ml-2" />
              تعديل
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={`text-sm mt-2 ${!initialData.description ? "text-slate-500 italic" : ""}`}>
  {initialData.description ? (
    <>
      <Preview value={initialData.description} />
    </>
  ) : (
    "مفيش وصف"
  )}
</div>

      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4 w-full"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Editor
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
            <div className="flex items-center gap-x-2">
              <Button type="submit" disabled={!isValid || isSubmitting}>
                تأكيد
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ChapterDescriptionForm;
