"use client";

import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  file,
  accept,
  onFile,
}: {
  file: File | null;
  accept?: string;
  onFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      aria-label="Seleccionar archivo"
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition-colors",
        dragging
          ? "border-brand bg-brand-soft"
          : "border-border bg-surface-subtle hover:border-brand hover:bg-brand-soft/40",
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFile(event.dataTransfer.files[0] ?? null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ")
          inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
    >
      <FileUp className="text-brand mb-3" size={26} />
      <span className="text-sm font-bold">
        {file ? file.name : "Arrastra un archivo o selecciónalo"}
      </span>
      <span className="text-muted mt-1 text-xs">
        CSV, TXT o XLSX · hasta 50 MB
      </span>
      <input
        ref={inputRef}
        accept={accept}
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        type="file"
      />
    </div>
  );
}
