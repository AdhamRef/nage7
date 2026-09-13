"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "@/components/quillStyles.css"

import "react-quill/dist/quill.bubble.css";

interface PreviewProps {
  value: string;
}

export const Preview: React.FC<PreviewProps> = ({ value }) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  return <ReactQuill value={value} theme="bubble" readOnly />;
};
