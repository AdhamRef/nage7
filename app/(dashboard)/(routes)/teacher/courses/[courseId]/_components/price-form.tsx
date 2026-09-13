"use client";

import { Course } from "@prisma/client";
import axios from "axios";
import { Gift, Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceFormProps {
  initialData: Course;
  courseId: string;
}

const PriceForm = ({ initialData, courseId }: PriceFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isFree, setIsFree] = useState(initialData.isFree);
  const [price, setPrice] = useState(String(initialData.price ?? ""));
  const [isSaving, setIsSaving] = useState(false);

  const toggleEdit = () => {
    setIsFree(initialData.isFree);
    setPrice(String(initialData.price ?? ""));
    setIsEditing((current) => !current);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = Number(price);
    if (!isFree && (price.trim() === "" || Number.isNaN(parsed) || parsed < 0)) {
      toast.error("أدخل سعراً صحيحاً");
      return;
    }

    setIsSaving(true);
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        isFree,
        // A free course keeps a 0 so nothing downstream has to guess.
        price: isFree ? 0 : parsed,
      });
      toast.success("تم تحديث السعر");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update the course price", error);
      toast.error("حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-slate-100 p-6 dark:bg-slate-900">
      <div className="flex items-center justify-between font-medium">
        سعر الدرس
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing ? (
            <>إلغاء</>
          ) : (
            <>
              <Pencil className="ml-2 h-4 w-4" />
              تعديل السعر
            </>
          )}
        </Button>
      </div>

      {!isEditing &&
        (initialData.isFree ? (
          <p className="mt-2 flex items-center gap-x-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Gift className="h-4 w-4" />
            مجاني بالكامل — مفتوح لكل الطلاب
          </p>
        ) : (
          <p
            className={cn(
              "mt-2 text-sm",
              initialData.price === null && "italic text-slate-500"
            )}
          >
            {formatPrice(initialData.price) ?? "لسه محددتش سعر"}
          </p>
        ))}

      {isEditing && (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Free / paid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={cn(
                "rounded-md border p-3 text-center text-sm font-semibold transition",
                isFree
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "hover:border-slate-400"
              )}
            >
              مجاني
            </button>
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={cn(
                "rounded-md border p-3 text-center text-sm font-semibold transition",
                !isFree
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "hover:border-slate-400"
              )}
            >
              مدفوع
            </button>
          </div>

          {isFree ? (
            <p className="text-xs leading-6 text-muted-foreground">
              الدرس هيكون متاح لأي طالب مسجل بدون أي رسوم.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Input
                type="number"
                step="1"
                min="0"
                disabled={isSaving}
                placeholder="مثال: 250"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                سعر الدرس كاملاً بالجنيه. تفتحه للطالب من صفحة «فتح الدروس».
              </p>
            </div>
          )}

          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تأكيد
          </Button>
        </form>
      )}
    </div>
  );
};

export default PriceForm;
