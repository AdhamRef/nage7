"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { File, ImageIcon, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Attachment, Course } from "@prisma/client";
import Image from "next/image";
import { FileUpload } from "@/components/file-upload";

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] };
  courseId: string;
}

const AttachmentForm: React.FC<AttachmentFormProps> = ({
  initialData,
  courseId,
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const formSchema = z.object({
    url: z.string().min(1),
    name: z.string().optional(),
    publicId: z.string().optional(),
    resourceType: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: initialData?.imageUrl || "" },
  });

  const { isSubmitting, isValid } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submitting form with values:", values);
    try {
      await axios.post(`/api/courses/${courseId}/attachments`, values);
      toast.success("تم تحديث معلومات الدرس");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update the course", error);
      toast.error("حدث خطأ");
    }
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`);
      toast.success("تم مسح المرفق");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-6">
      <div className="font-medium flex items-center justify-between">
        مرفقات الدرس
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing && <>إلغاء</>}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4 ml-2" />
              أضف ملف
            </>
          )}
        </Button>
      </div>
      {isEditing ? (
        <div>
          <FileUpload
            endpoint="courseAttachment"
            onChange={async (file) => {
              if (!file) {
                toast.error("حدث خطأ أثناء رفع الملف");
                return;
              }
              await onSubmit({
                url: file.url,
                name: file.originalFilename
                  ? [file.originalFilename, file.format].filter(Boolean).join(".")
                  : undefined,
                publicId: file.publicId,
                resourceType: file.resourceType,
              });
            }}
          />
          <div className="text-xs text-muted-foreground mt-4">
            ارفع أي ملف الطالب ممكن يحتاجه وهو بيذاكر
          </div>
        </div>
      ) : (
        <>
          {initialData.attachments.length == 0 ? (
            <p className=" text-sm mt-2 text-slate-500 italic">
              لسه مرفوعتش أي ملفات
            </p>
          ) : (
            <div className="space-y-2">
              {initialData.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md"
                >
                  <File className=" h-4 w-4 ml-2 flex-shrink-0" />
                  <p className=" text-xs line-clamp-1">{attachment.name}</p>
                  {deletingId === attachment.id && (
                    <div className="mr-auto">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {deletingId !== attachment.id && (
                    <button
                      onClick={() => {
                        onDelete(attachment.id);
                      }}
                      className=" mr-auto hover:opacity-75 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttachmentForm;
