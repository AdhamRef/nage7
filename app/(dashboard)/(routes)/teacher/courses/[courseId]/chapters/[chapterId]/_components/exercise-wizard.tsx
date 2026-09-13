"use client";

import { Exercise } from "@prisma/client";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  FileCode2,
  HelpCircle,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import CodePlayground from "@/components/code-playground";
import McqExercise from "@/components/mcq-exercise";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EXERCISE_LANGUAGES,
  EXERCISE_TYPES,
  MCQ_CHOICES,
  QUIZ_EDITOR_TABS,
  QUIZ_MATCH_MODES,
  editorTabId,
  exerciseLanguageHints,
  exerciseLanguageLabels,
  exerciseTypeHints,
  exerciseTypeLabels,
  quizEditorTabLabels,
  quizMatchModeHints,
  quizMatchModeLabels,
  type ExerciseLanguage,
  type ExerciseType,
} from "@/lib/quiz";
import { quizTemplates, type QuizTemplate } from "@/lib/quiz-templates";
import { cn } from "@/lib/utils";

const CodeEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
});

const LETTERS = ["أ", "ب", "ج", "د"];

interface Values {
  type: ExerciseType;
  question: string;
  hint: string;
  // code
  language: ExerciseLanguage;
  starterPython: string;
  starterHtml: string;
  starterCss: string;
  starterJs: string;
  expectedOutput: string;
  matchMode: string;
  caseSensitive: boolean;
  defaultTab: string;
  // mcq
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const blank: Values = {
  type: "CODE",
  question: "",
  hint: "",
  starterHtml: "",
  starterCss: "",
  starterJs: '// اكتب حلك هنا\nconsole.log("مرحبا");',
  language: "WEB",
  starterPython: '# اكتب حلك هنا\nprint("مرحبا")',
  expectedOutput: "",
  matchMode: "CONSOLE",
  caseSensitive: false,
  defaultTab: "JS",
  choices: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
};

const fromExercise = (exercise: Exercise): Values => ({
  type: exercise.type,
  question: exercise.question,
  hint: exercise.hint ?? "",
  starterHtml: exercise.starterHtml,
  starterCss: exercise.starterCss,
  starterJs: exercise.starterJs,
  language: exercise.language,
  starterPython: exercise.starterPython,
  expectedOutput: exercise.expectedOutput,
  matchMode: exercise.matchMode,
  caseSensitive: exercise.caseSensitive,
  defaultTab: exercise.defaultTab,
  choices:
    exercise.choices.length === MCQ_CHOICES
      ? exercise.choices
      : ["", "", "", ""],
  correctIndex: exercise.correctIndex ?? 0,
  explanation: exercise.explanation ?? "",
});

const STEPS = ["السؤال", "التصحيح", "معاينة"];

interface ExerciseWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  /** null creates a new exercise. */
  exercise: Exercise | null;
}

export const ExerciseWizard = ({
  open,
  onOpenChange,
  courseId,
  chapterId,
  exercise,
}: ExerciseWizardProps) => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(blank);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset every time the dialog opens, so a stale draft never leaks across.
  useEffect(() => {
    if (!open) return;
    setValues(exercise ? fromExercise(exercise) : blank);
    setStep(0);
    setError(null);
  }, [open, exercise]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const applyTemplate = (template: QuizTemplate) => {
    setValues((current) => ({
      ...current,
      type: "CODE",
      language: "WEB",
      question: template.values.question,
      hint: template.values.hint,
      starterHtml: template.values.starterHtml,
      starterCss: template.values.starterCss,
      starterJs: template.values.starterJs,
      expectedOutput: template.values.expectedOutput,
      matchMode: template.values.matchMode,
      caseSensitive: template.values.caseSensitive,
    }));
    toast.success(`تم إدراج قالب: ${template.label}`);
  };

  const validate = () => {
    if (step === 0) {
      if (!values.question.trim()) return "أدخل نص السؤال";
      if (values.type === "MCQ" && values.choices.some((c) => !c.trim())) {
        return `أدخل ${MCQ_CHOICES} إجابات كاملة`;
      }
    }
    if (step === 1 && values.type === "CODE" && !values.expectedOutput.trim()) {
      return "أدخل الناتج المتوقع";
    }
    return null;
  };

  const next = () => {
    const found = validate();
    if (found) {
      setError(found);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const base = `/api/courses/${courseId}/chapters/${chapterId}/exercises`;
      if (exercise) {
        await axios.patch(`${base}/${exercise.id}`, values);
      } else {
        await axios.post(base, values);
      }
      toast.success(exercise ? "تم تحديث التمرين" : "تم إضافة التمرين");
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      const message = err?.response?.data?.error ?? "حدث خطأ";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const optionCard = (active: boolean) =>
    cn(
      "rounded-lg border p-4 text-right transition",
      active
        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
        : "hover:border-slate-400"
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "تعديل التمرين" : "تمرين جديد"}
          </DialogTitle>
          <DialogDescription>
            الخطوة {step + 1} من {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-x-2" dir="ltr">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              )}
            />
          ))}
        </div>

        <div className="space-y-5 py-2">
          {/* ---------- Step 1 — type, question, answers ---------- */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>نوع التمرين</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {EXERCISE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set("type", type)}
                      className={optionCard(values.type === type)}
                    >
                      <span className="flex items-center gap-x-2 font-semibold">
                        {type === "MCQ" ? (
                          <HelpCircle className="h-4 w-4" />
                        ) : (
                          <Code2 className="h-4 w-4" />
                        )}
                        {exerciseTypeLabels[type]}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {exerciseTypeHints[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {values.type === "CODE" && (
                <div className="space-y-2">
                  <Label>لغة التمرين</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {EXERCISE_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => set("language", lang)}
                        className={optionCard(values.language === lang)}
                      >
                        <span className="flex items-center gap-x-2 font-semibold">
                          {lang === "PYTHON" ? (
                            <FileCode2 className="h-4 w-4" />
                          ) : (
                            <Code2 className="h-4 w-4" />
                          )}
                          {exerciseLanguageLabels[lang]}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {exerciseLanguageHints[lang]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {values.type === "CODE" && values.language === "WEB" && (
                <div className="rounded-md border border-dashed p-4">
                  <p className="mb-3 text-sm font-semibold">قوالب جاهزة</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quizTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="rounded-md border p-2.5 text-right text-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      >
                        <span className="font-semibold">{template.label}</span>
                        <span className="mr-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold dark:bg-slate-800">
                          {template.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ex-question">السؤال / المطلوب</Label>
                <Textarea
                  id="ex-question"
                  rows={3}
                  value={values.question}
                  onChange={(e) => set("question", e.target.value)}
                  placeholder="اكتب المطلوب من الطالب"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ex-hint">تلميح (اختياري)</Label>
                <Textarea
                  id="ex-hint"
                  rows={2}
                  value={values.hint}
                  onChange={(e) => set("hint", e.target.value)}
                />
              </div>

              {values.type === "MCQ" ? (
                <div className="space-y-2">
                  <Label>الإجابات — دوس على الدايرة عشان تختار الصح</Label>
                  {values.choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-x-2">
                      <button
                        type="button"
                        onClick={() => set("correctIndex", index)}
                        aria-label={`الإجابة ${LETTERS[index]} صحيحة`}
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition",
                          values.correctIndex === index
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "hover:border-emerald-500"
                        )}
                      >
                        {LETTERS[index]}
                      </button>
                      <Input
                        value={choice}
                        placeholder={`الإجابة ${LETTERS[index]}`}
                        onChange={(e) => {
                          const nextChoices = [...values.choices];
                          nextChoices[index] = e.target.value;
                          set("choices", nextChoices);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : values.language === "PYTHON" ? (
                <div className="space-y-1.5">
                  <Label>الكود المبدئي للطالب — Python</Label>
                  <div className="overflow-hidden rounded-md border">
                    <CodeEditor
                      language="python"
                      value={values.starterPython}
                      onChange={(value) => set("starterPython", value)}
                      height="220px"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    الكود بيشتغل في المتصفح على Pyodide، والتصحيح على اللي
                    بيطبعه <code>print</code>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium">الكود المبدئي للطالب</p>
                  {(
                    [
                      ["starterHtml", "HTML", "html"],
                      ["starterCss", "CSS", "css"],
                      ["starterJs", "JavaScript", "javascript"],
                    ] as const
                  ).map(([key, label, language]) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <div className="overflow-hidden rounded-md border">
                        <CodeEditor
                          language={language}
                          value={values[key]}
                          onChange={(value) => set(key, value)}
                          height="150px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---------- Step 2 — grading ---------- */}
          {step === 1 && (
            <>
              {values.type === "MCQ" ? (
                <>
                  <div className="rounded-md border p-4 text-sm">
                    <p className="font-semibold">الإجابة الصحيحة</p>
                    <p className="mt-1 text-muted-foreground">
                      {LETTERS[values.correctIndex]} —{" "}
                      {values.choices[values.correctIndex] || "—"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ex-explanation">شرح الإجابة (اختياري)</Label>
                    <Textarea
                      id="ex-explanation"
                      rows={3}
                      value={values.explanation}
                      onChange={(e) => set("explanation", e.target.value)}
                      placeholder="يظهر بعد ما يجاوب الطالب"
                    />
                  </div>
                </>
              ) : (
                <>
                  {values.language === "PYTHON" ? (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      تمارين بايثون بتتصحح على مخرجات <code>print</code>.
                    </p>
                  ) : (
                  <div className="space-y-2">
                    <Label>طريقة التصحيح</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {QUIZ_MATCH_MODES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => set("matchMode", mode)}
                          className={optionCard(values.matchMode === mode)}
                        >
                          <span className="block font-semibold">
                            {quizMatchModeLabels[mode]}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {quizMatchModeHints[mode]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="ex-expected">الناتج المتوقع</Label>
                    <Textarea
                      id="ex-expected"
                      dir="ltr"
                      rows={4}
                      className="text-left font-mono"
                      value={values.expectedOutput}
                      onChange={(e) => set("expectedOutput", e.target.value)}
                      placeholder={"1\n2\n3"}
                    />
                  </div>

                  <label className="flex items-center gap-x-3 rounded-md border p-4 text-sm">
                    <Checkbox
                      checked={values.caseSensitive}
                      onCheckedChange={(checked) =>
                        set("caseSensitive", Boolean(checked))
                      }
                    />
                    التفرقة بين الحروف الكبيرة والصغيرة
                  </label>

                  {values.language === "WEB" && (
                  <div className="space-y-2">
                    <Label>التبويب المفتوح افتراضياً</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {QUIZ_EDITOR_TABS.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => set("defaultTab", tab)}
                          className={cn(
                            optionCard(values.defaultTab === tab),
                            "text-center font-semibold"
                          )}
                        >
                          {quizEditorTabLabels[tab]}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                </>
              )}

            </>
          )}

          {/* ---------- Step 3 — preview ---------- */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                دي اللي الطالب هيشوفها بالظبط.
              </p>
              {values.type === "MCQ" ? (
                <McqExercise
                  question={values.question}
                  hint={values.hint}
                  choices={values.choices}
                  correctIndex={values.correctIndex}
                  explanation={values.explanation}
                  celebrateOnSuccess={false}
                />
              ) : (
                <CodePlayground
                  question={values.question}
                  hint={values.hint}
                  language={values.language}
                  starterPython={values.starterPython}
                  starterHtml={values.starterHtml}
                  starterCss={values.starterCss}
                  starterJs={values.starterJs}
                  expectedOutput={values.expectedOutput}
                  matchMode={
                    values.language === "PYTHON"
                      ? "CONSOLE"
                      : (values.matchMode as any)
                  }
                  caseSensitive={values.caseSensitive}
                  defaultTab={editorTabId(values.defaultTab as any)}
                  revealExpected
                  celebrateOnSuccess={false}
                />
              )}
            </div>
          )}

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-x-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowRight className="ml-2 h-4 w-4" />
                رجوع
              </Button>
            )}
          </div>

          {step < STEPS.length - 1 ? (
            <Button onClick={next}>كمّل</Button>
          ) : (
            <Button onClick={save} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {exercise ? "حفظ التعديلات" : "إضافة التمرين"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseWizard;
