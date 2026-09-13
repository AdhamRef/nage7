"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

export type EditorLanguage = "html" | "css" | "javascript" | "python";

const extensionsByLanguage = {
  html: [html()],
  css: [css()],
  javascript: [javascript()],
  python: [python()],
};

interface CodeEditorProps {
  language: EditorLanguage;
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

/**
 * CodeMirror 6 wrapper. Always dark and always LTR — code reads left to right
 * even inside this RTL app.
 */
const CodeEditor = ({
  language,
  value,
  onChange,
  height = "320px",
  readOnly,
}: CodeEditorProps) => {
  return (
    <div dir="ltr" className="overflow-hidden text-left">
      <CodeMirror
        value={value}
        height={height}
        theme={oneDark}
        readOnly={readOnly}
        extensions={extensionsByLanguage[language]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          foldGutter: false,
        }}
      />
    </div>
  );
};

export default CodeEditor;
