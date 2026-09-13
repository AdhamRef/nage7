/**
 * Shared pieces of the in-browser coding quiz: how a chapter's expected output
 * is matched, and the sandboxed document the student's HTML/CSS/JS runs inside.
 */

export type QuizMatchMode = "CONSOLE" | "TEXT";

export const QUIZ_MATCH_MODES: QuizMatchMode[] = ["CONSOLE", "TEXT"];

export const quizMatchModeLabels: Record<QuizMatchMode, string> = {
  CONSOLE: "مخرجات console.log",
  TEXT: "النص الظاهر في الصفحة",
};

export const quizMatchModeHints: Record<QuizMatchMode, string> = {
  CONSOLE:
    "يقارن ما يطبعه الطالب باستخدام console.log بالناتج المتوقع، سطراً بسطر.",
  TEXT: "يقارن النص الظاهر داخل الصفحة بعد تشغيل الكود بالناتج المتوقع.",
};

export const isQuizMatchMode = (value: unknown): value is QuizMatchMode =>
  typeof value === "string" && QUIZ_MATCH_MODES.includes(value as QuizMatchMode);

/** Which of the three editors the exercise opens on. */
export type QuizEditorTab = "HTML" | "CSS" | "JS";

export const QUIZ_EDITOR_TABS: QuizEditorTab[] = ["HTML", "CSS", "JS"];

export const quizEditorTabLabels: Record<QuizEditorTab, string> = {
  HTML: "HTML",
  CSS: "CSS",
  JS: "JavaScript",
};

export const isQuizEditorTab = (value: unknown): value is QuizEditorTab =>
  typeof value === "string" && QUIZ_EDITOR_TABS.includes(value as QuizEditorTab);

/** A chapter can hold coding exercises and multiple-choice questions. */
export type ExerciseType = "CODE" | "MCQ";

export const EXERCISE_TYPES: ExerciseType[] = ["CODE", "MCQ"];

export const exerciseTypeLabels: Record<ExerciseType, string> = {
  CODE: "تمرين برمجي",
  MCQ: "سؤال اختيار من متعدد",
};

export const exerciseTypeHints: Record<ExerciseType, string> = {
  CODE: "الطالب يكتب كود (ويب أو بايثون) ونقارن الناتج بالمتوقع.",
  MCQ: "سؤال بأربع إجابات، الطالب يختار واحدة.",
};

export const isExerciseType = (value: unknown): value is ExerciseType =>
  typeof value === "string" && EXERCISE_TYPES.includes(value as ExerciseType);

/** Coding exercises run either in the browser DOM or on Pyodide. */
export type ExerciseLanguage = "WEB" | "PYTHON";

export const EXERCISE_LANGUAGES: ExerciseLanguage[] = ["WEB", "PYTHON"];

export const exerciseLanguageLabels: Record<ExerciseLanguage, string> = {
  WEB: "HTML / CSS / JavaScript",
  PYTHON: "Python",
};

export const exerciseLanguageHints: Record<ExerciseLanguage, string> = {
  WEB: "ثلاثة محررات ومعاينة حية للصفحة.",
  PYTHON: "محرر واحد، والتصحيح على المطبوع بـ print().",
};

export const isExerciseLanguage = (value: unknown): value is ExerciseLanguage =>
  typeof value === "string" &&
  EXERCISE_LANGUAGES.includes(value as ExerciseLanguage);

/** Every multiple-choice question has exactly this many choices. */
export const MCQ_CHOICES = 4;

/** Stored uppercase; the playground works in lowercase ids. */
export const editorTabId = (tab: QuizEditorTab) =>
  tab.toLowerCase() as "html" | "css" | "js";

/**
 * Trims each line and drops blank ones so a student isn't failed over spacing.
 */
export const normalizeOutput = (value: string, caseSensitive: boolean) => {
  const cleaned = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();

  return caseSensitive ? cleaned : cleaned.toLowerCase();
};

export interface QuizRunReport {
  phase: "initial" | "loading" | "settled";
  logs: string[];
  text: string;
  error: string | null;
}

/** The output a given match mode grades against. */
export const outputForMode = (report: QuizRunReport, mode: QuizMatchMode) =>
  mode === "CONSOLE" ? report.logs.join("\n") : report.text;

export const isAnswerCorrect = (
  report: QuizRunReport,
  expectedOutput: string,
  mode: QuizMatchMode,
  caseSensitive: boolean
) => {
  const actual = normalizeOutput(outputForMode(report, mode), caseSensitive);
  const expected = normalizeOutput(expectedOutput, caseSensitive);
  return expected.length > 0 && actual === expected;
};

/** Keeps user code from escaping the script tag it is embedded in. */
const escapeClosingTags = (code: string) => code.replace(/<\/(script)/gi, "<\\/$1");

/**
 * Runs first inside the frame so it can capture console output before any of
 * the student's own code executes, then reports back to the parent window.
 */
const BOOTSTRAP = `
(function () {
  var logs = [];
  var errors = [];

  function serialize(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.name + ': ' + value.message;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (method) {
    var original = console[method];
    console[method] = function () {
      var line = Array.prototype.slice.call(arguments).map(serialize).join(' ');
      logs.push(line);
      if (method === 'error') errors.push(line);
      try { original.apply(console, arguments); } catch (e) {}
    };
  });

  function report(phase) {
    try {
      parent.postMessage({
        source: 'nage7-quiz',
        phase: phase,
        logs: logs.slice(),
        text: document.body ? (document.body.innerText || '') : '',
        error: errors.length ? errors[0] : null
      }, '*');
    } catch (e) {}
  }

  window.addEventListener('error', function (event) {
    errors.push(event.message || 'خطأ غير متوقع');
    report('settled');
  });

  window.addEventListener('unhandledrejection', function (event) {
    errors.push(String(event.reason));
  });

  document.addEventListener('DOMContentLoaded', function () { report('initial'); });
  window.addEventListener('load', function () {
    setTimeout(function () { report('settled'); }, 250);
  });

  // The parent polls while it waits, because a report posted while the frame
  // was still navigating can be dropped.
  window.addEventListener('message', function (event) {
    if (event.data && event.data.source === 'nage7-quiz-parent') {
      report(document.readyState === 'complete' ? 'settled' : 'initial');
    }
  });
})();
`;

/** Pinned so a CDN "latest" never changes the runtime under the students. */
export const PYODIDE_VERSION = "0.26.4";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const PYTHON_BOOTSTRAP = `
var logs = [];
var errors = [];
var currentPhase = 'loading';

function report(phase) {
  currentPhase = phase;
  try {
    parent.postMessage({
      source: 'nage7-quiz',
      phase: phase,
      logs: logs.slice(),
      text: logs.join('\\n'),
      error: errors.length ? errors[0] : null
    }, '*');
  } catch (e) {}
}

window.addEventListener('message', function (event) {
  if (event.data && event.data.source === 'nage7-quiz-parent') {
    report(currentPhase);
  }
});

async function runPython() {
  report('loading');

  if (typeof loadPyodide !== 'function') {
    errors.push('تعذر تحميل بيئة بايثون. تحقق من اتصالك بالإنترنت.');
    report('settled');
    return;
  }

  try {
    var pyodide = await loadPyodide({ indexURL: '${PYODIDE_BASE}' });
    pyodide.setStdout({ batched: function (line) { logs.push(line); } });
    pyodide.setStderr({
      batched: function (line) { logs.push(line); errors.push(line); }
    });
    await pyodide.runPythonAsync(window.__USER_CODE__);
  } catch (error) {
    errors.push(String((error && error.message) || error));
  }

  report('settled');
}
`;

export interface PythonSandbox {
  code: string;
  /** Forces a fresh document (and therefore a reload) on every run. */
  runId: number;
}

/**
 * A Python runner in the same sandboxed frame the web exercises use. Pyodide
 * is a few megabytes, so the first run is slow — the parent shows a notice
 * while `phase: "loading"` is outstanding.
 */
export const buildPythonDocument = ({ code, runId }: PythonSandbox) => `<!doctype html>
<html lang="ar" data-run="${runId}">
  <head>
    <meta charset="utf-8" />
    <script src="${PYODIDE_BASE}pyodide.js"><\/script>
    <script>
${PYTHON_BOOTSTRAP}
    <\/script>
  </head>
  <body>
    <script>
      window.__USER_CODE__ = ${escapeClosingTags(JSON.stringify(code))};
      runPython();
    <\/script>
  </body>
</html>`;

export interface SandboxSources {
  html: string;
  css: string;
  js: string;
  /** Forces a fresh document (and therefore a reload) on every run. */
  runId: number;
}

export const buildSandboxDocument = ({ html, css, js, runId }: SandboxSources) => `<!doctype html>
<html lang="ar" data-run="${runId}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>${BOOTSTRAP}</script>
    <style>
      body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; padding: 16px; }
    </style>
    <style>${css}</style>
  </head>
  <body>
${html}
    <script>
      try {
${escapeClosingTags(js)}
      } catch (error) {
        console.error(error);
      }
    </script>
  </body>
</html>`;
