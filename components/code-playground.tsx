"use client";

import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import {
  buildPythonDocument,
  buildSandboxDocument,
  isAnswerCorrect,
  outputForMode,
  type ExerciseLanguage,
  type QuizMatchMode,
  type QuizRunReport,
} from "@/lib/quiz";
import { cn } from "@/lib/utils";

const CodeEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center bg-[#282c34]">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
});

type EditorTab = "html" | "css" | "js" | "python";
type PaneTab = "preview" | "console";
type Status = "idle" | "running" | "checking" | "correct" | "wrong";

/**
 * How long to wait for the sandbox before giving up. An infinite loop in the
 * student's code blocks the frame's event loop, so its "settled" report never
 * arrives — without this the buttons stay disabled forever.
 */
const RUN_TIMEOUT_MS = 8000;
/** Pyodide has to download a few megabytes on the first run. */
const PYTHON_TIMEOUT_MS = 60000;

const WEB_TABS: { id: EditorTab; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JavaScript" },
];

const PYTHON_TABS: { id: EditorTab; label: string }[] = [
  { id: "python", label: "Python" },
];

export interface CodePlaygroundProps {
  question: string;
  hint?: string | null;
  starterHtml: string;
  starterCss: string;
  starterJs: string;
  expectedOutput: string;
  matchMode: QuizMatchMode;
  caseSensitive: boolean;
  /** Teacher preview: shows the expected output next to the result. */
  revealExpected?: boolean;
  /** Persists the learner's draft between visits. */
  storageKey?: string;
  celebrateOnSuccess?: boolean;
  /** WEB uses the three editors; PYTHON uses one and runs on Pyodide. */
  language?: ExerciseLanguage;
  starterPython?: string;
  /** Fires the first time the answer is right. */
  onSolved?: () => void;
  /** Every graded run, so a wrong submission is reviewable too. */
  onAnswer?: (answer: { code: string; isCorrect: boolean }) => void;
  /** Which editor the exercise opens on. */
  defaultTab?: EditorTab;
}

/**
 * The chapter exercise: a three-file HTML/CSS/JS editor, a sandboxed live
 * preview, a captured console, and a grader that compares the run's output
 * against what the instructor expects.
 */
export const CodePlayground = ({
  question,
  hint,
  starterHtml,
  starterCss,
  starterJs,
  expectedOutput,
  matchMode,
  caseSensitive,
  revealExpected = false,
  storageKey,
  celebrateOnSuccess = true,
  onSolved,
  onAnswer,
  language = "WEB",
  starterPython = "",
  defaultTab = "js",
}: CodePlaygroundProps) => {
  const confetti = useConfettiStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runIdRef = useRef(0);
  const pendingCheckRef = useRef(false);
  const solvedRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  const isPython = language === "PYTHON";

  const [sources, setSources] = useState({
    html: starterHtml,
    css: starterCss,
    js: starterJs,
    python: starterPython,
  });
  const [notice, setNotice] = useState<string | null>(null);
  // The message handler runs inside an effect, so it needs the latest source.
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const [hydrated, setHydrated] = useState(false);
  const editorTabs = isPython ? PYTHON_TABS : WEB_TABS;
  const [editorTab, setEditorTab] = useState<EditorTab>(
    isPython ? "python" : defaultTab
  );
  // Python prints; there is nothing to preview.
  const [paneTab, setPaneTab] = useState<PaneTab>(
    isPython || matchMode === "CONSOLE" ? "console" : "preview"
  );
  const [srcDoc, setSrcDoc] = useState("");
  const [report, setReport] = useState<QuizRunReport | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const localKey = storageKey ? `nage7-quiz:${storageKey}` : null;

  // Restore any draft the student left behind before the first run.
  useEffect(() => {
    if (!localKey) {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(localKey);
      if (raw) {
        const saved = JSON.parse(raw);
        setSources({
          html: typeof saved.html === "string" ? saved.html : starterHtml,
          css: typeof saved.css === "string" ? saved.css : starterCss,
          js: typeof saved.js === "string" ? saved.js : starterJs,
          python:
            typeof saved.python === "string" ? saved.python : starterPython,
        });
      }
    } catch {
      // A blocked or corrupted store just means we start from the starters.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey]);

  useEffect(() => {
    if (!hydrated || !localKey) return;
    try {
      window.localStorage.setItem(localKey, JSON.stringify(sources));
    } catch {
      // Ignore private-mode / quota failures.
    }
  }, [sources, hydrated, localKey]);

  const run = (check: boolean) => {
    runIdRef.current += 1;
    pendingCheckRef.current = check;
    setNotice(null);
    setStatus(check ? "checking" : "running");

    setSrcDoc(
      isPython
        ? buildPythonDocument({
            code: sources.python,
            runId: runIdRef.current,
          })
        : buildSandboxDocument({ ...sources, runId: runIdRef.current })
    );

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      pendingCheckRef.current = false;
      setStatus("idle");
      setNotice(null);
    }, isPython ? PYTHON_TIMEOUT_MS : RUN_TIMEOUT_MS);
  };

  // First render: show something in the preview straight away. Python waits
  // for an explicit run so the page does not download Pyodide unprompted.
  useEffect(() => {
    if (hydrated && !isPython) run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only trust messages coming from our own sandbox frame.
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }
      const data = event.data as QuizRunReport & { source?: string };
      if (!data || data.source !== "nage7-quiz") return;

      if (data.phase === "loading") {
        setNotice("جاري تحميل بيئة بايثون لأول مرة… قد يستغرق دقيقة.");
        return;
      }

      setReport(data);
      if (data.phase !== "settled") return;

      window.clearTimeout(timeoutRef.current);
      setNotice(null);

      if (!pendingCheckRef.current) {
        setStatus("idle");
        return;
      }

      pendingCheckRef.current = false;
      const correct = isAnswerCorrect(
        data,
        expectedOutput,
        matchMode,
        caseSensitive
      );
      setStatus(correct ? "correct" : "wrong");

      onAnswerRef.current?.({
        code: isPython
          ? sourcesRef.current.python
          : [
              sourcesRef.current.html,
              sourcesRef.current.css,
              sourcesRef.current.js,
            ]
              .filter(Boolean)
              .join("\n\n/* --- */\n\n"),
        isCorrect: correct,
      });

      if (correct && !solvedRef.current) {
        solvedRef.current = true;
        onSolvedRef.current?.();
        if (celebrateOnSuccess) confetti.onOpen();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [expectedOutput, matchMode, caseSensitive, celebrateOnSuccess, confetti]);

  // Only the unmount should cancel the run timer.
  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const reset = () => {
    setSources({
      html: starterHtml,
      css: starterCss,
      js: starterJs,
      python: starterPython,
    });
    setNotice(null);
    window.clearTimeout(timeoutRef.current);
    setStatus("idle");
    setReport(null);
    solvedRef.current = false;
    if (localKey) {
      try {
        window.localStorage.removeItem(localKey);
      } catch {
        // Nothing to do.
      }
    }
  };

  const busy = status === "running" || status === "checking";

  // Ask the frame how the run went for as long as we are waiting. Without this
  // a single dropped report leaves the toolbar disabled until a page reload.
  useEffect(() => {
    if (!busy) return;

    const ask = () =>
      iframeRef.current?.contentWindow?.postMessage(
        { source: "nage7-quiz-parent" },
        "*"
      );

    const id = window.setInterval(ask, 700);
    return () => window.clearInterval(id);
  }, [busy]);

  const actualOutput = report ? outputForMode(report, matchMode) : "";

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Question */}
      <div className="border-b bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="whitespace-pre-line text-lg font-medium leading-8">
          {question}
        </p>
        {hint && (
          <details className="group mt-4">
            <summary className="inline-flex cursor-pointer items-center gap-x-2 text-sm font-semibold text-sky-700 marker:content-[''] dark:text-sky-400">
              <Lightbulb className="h-4 w-4" />
              تلميح
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {hint}
            </p>
          </details>
        )}
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Editor */}
        <div className="border-b lg:border-b-0 lg:border-l dark:border-slate-800">
          <div className="flex items-center gap-x-1 border-b bg-slate-100 px-2 dark:border-slate-800 dark:bg-slate-900">
            {editorTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditorTab(tab.id)}
                className={cn(
                  "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
                  editorTab === tab.id &&
                    "border-emerald-500 text-slate-900 dark:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {editorTabs.map((tab) => (
            <div key={tab.id} hidden={editorTab !== tab.id}>
              <CodeEditor
                language={tab.id === "js" ? "javascript" : tab.id}
                value={sources[tab.id]}
                onChange={(value) =>
                  setSources((current) => ({
                    ...current,
                    [tab.id]: value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        {/* Preview + console */}
        <div className="flex flex-col">
          <div className="flex items-center gap-x-1 border-b bg-slate-100 px-2 dark:border-slate-800 dark:bg-slate-900">
            {!isPython && (
            <button
              type="button"
              onClick={() => setPaneTab("preview")}
              className={cn(
                "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
                paneTab === "preview" &&
                  "border-emerald-500 text-slate-900 dark:text-white"
              )}
            >
              المعاينة
            </button>
            )}
            <button
              type="button"
              onClick={() => setPaneTab("console")}
              className={cn(
                "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
                paneTab === "console" &&
                  "border-emerald-500 text-slate-900 dark:text-white"
              )}
            >
              الناتج
              {report?.logs.length ? ` (${report.logs.length})` : ""}
            </button>
          </div>

          <div className="relative h-[320px]">
            {/* The frame runs with allow-scripts only: opaque origin, no access
                to this page's DOM, cookies or storage. */}
            <iframe
              ref={iframeRef}
              title="معاينة الكود"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className={cn(
                "h-full w-full bg-white",
                (isPython || paneTab !== "preview") &&
                  "invisible absolute inset-0"
              )}
            />

            {(isPython || paneTab === "console") && (
              <div
                dir="ltr"
                className="absolute inset-0 overflow-auto bg-slate-950 p-4 text-left font-mono text-sm text-slate-200"
              >
                {report?.logs.length ? (
                  report.logs.map((line, index) => (
                    <div
                      key={index}
                      className="whitespace-pre-wrap border-b border-white/5 py-1"
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">لسه مفيش مخرجات.</p>
                )}
                {report?.error && (
                  <div className="mt-3 flex items-start gap-x-2 rounded bg-red-500/10 p-2 text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-pre-wrap">{report.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <p className="border-t bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-slate-800 dark:bg-amber-500/10 dark:text-amber-300">
          {notice}
        </p>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Button onClick={() => run(false)} disabled={busy} variant="outline" size="sm">
          {status === "running" ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="ml-2 h-4 w-4" />
          )}
          تشغيل
        </Button>
        <Button onClick={() => run(true)} disabled={busy} size="sm">
          {status === "checking" ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="ml-2 h-4 w-4" />
          )}
          تحقق من الإجابة
        </Button>
        <Button onClick={reset} disabled={busy} variant="ghost" size="sm">
          <RotateCcw className="ml-2 h-4 w-4" />
          إعادة تعيين
        </Button>
      </div>

      {/* Result */}
      {(status === "correct" || status === "wrong") && (
        <div
          className={cn(
            "flex items-start gap-x-3 border-t p-5",
            status === "correct"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300"
          )}
        >
          {status === "correct" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {status === "correct"
                ? "إجابة صحيحة! أحسنت 🎉"
                : "الناتج لا يطابق المتوقع بعد. راجع الكود وجرّب تاني."}
            </p>

            {status === "wrong" && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold opacity-70">ناتجك الحالي</p>
                  <pre
                    dir="ltr"
                    className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-3 text-left font-mono text-xs dark:bg-black/40"
                  >
                    {actualOutput.trim() || "(مفيش ناتج)"}
                  </pre>
                </div>
                {revealExpected && (
                  <div>
                    <p className="text-xs font-semibold opacity-70">
                      الناتج المتوقع
                    </p>
                    <pre
                      dir="ltr"
                      className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-3 text-left font-mono text-xs dark:bg-black/40"
                    >
                      {expectedOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodePlayground;
