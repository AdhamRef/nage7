"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill/dist/quill.snow.css";
import "./quillStyles.css"; // Import your custom styles

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const Editor: React.FC<EditorProps> = ({ onChange, value }) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  return (
    <div className="bg-white">
      <ReactQuill value={value} onChange={onChange} theme="snow" />
    </div>
  );
};
