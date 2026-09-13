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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Router from "next/navigation";

type Props = {
  initialData: {
    title: string;
  };
  courseId: string;
  chapterId: string;
};

const ChapterTitleForm = ({ initialData, courseId, chapterId }: Props) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const formSchema = z.object({
    title: z.string().min(1, {
      message: "العنوان مطلوب",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
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
        عنوان الجزء
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
      {!isEditing && <p className=" text-sm mt-2">{initialData.title}</p>}
      {isEditing && (
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
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="عنوان الجزء"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    هتقدّم إيه في الدرس ده؟
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className=" flex items-center gap-x-2">
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

export default ChapterTitleForm;
