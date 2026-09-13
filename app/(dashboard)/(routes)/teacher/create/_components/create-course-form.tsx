"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Check, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "العنوان مطلوب",
  }),
});

export interface CreateGroupOption {
  id: string;
  name: string;
  memberCount: number;
}

/** Name the course and, optionally, pick who it opens for straight away. */
const CreateCourseForm = ({ groups }: { groups: CreateGroupOption[] }) => {
  const router = useRouter();
  const [groupIds, setGroupIds] = useState<Set<string>>(new Set());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;

  const toggle = (id: string) =>
    setGroupIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.post("/api/courses", {
        ...values,
        groupIds: Array.from(groupIds),
      });
      router.push(`/teacher/courses/${response.data.id}`);
      toast.success("تم اِنشاء الدرس");
    } catch {
      toast.error("حدث خطأ");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 w-full space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان الدرس</FormLabel>
              <FormControl>
                <Input placeholder="عنوان الدرس" {...field} />
              </FormControl>
              <FormDescription>هتقدّم إيه في الدرس ده؟</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {groups.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-x-2 text-sm font-medium">
              <Layers className="h-4 w-4 text-brand" />
              يُفتح لمجموعات (اختياري)
            </p>
            <p className="text-xs text-muted-foreground">
              اختر المجموعات اللي الدرس ده هيتفتح لأعضائها فور نشره.
            </p>

            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              {groups.map((group) => {
                const isOn = groupIds.has(group.id);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggle(group.id)}
                    className={cn(
                      "flex items-center gap-x-3 rounded-lg border p-3 text-right transition",
                      isOn
                        ? "border-brand bg-brand/5"
                        : "hover:border-slate-400 dark:border-slate-800"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                        isOn
                          ? "border-brand bg-brand text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {isOn && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {group.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {group.memberCount} طالب
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-x-2">
          <Link href="/">
            <Button variant="ghost" type="button">
              الغاء
            </Button>
          </Link>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            التالي
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateCourseForm;
