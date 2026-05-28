"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "application/pdf";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === ACCEPT || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) return;

    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const unique = pdfs.filter((f) => !names.has(f.name));
      return [...prev, ...unique];
    });
    setStatus(null);
  }, []);

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Upload failed"
        );
      }

      const totalChunks = data.documents.reduce(
        (sum: number, d: { chunks: number }) => sum + d.chunks,
        0
      );

      setFiles([]);
      setStatus({
        type: "success",
        message: `Indexed ${data.documents.length} PDF${data.documents.length === 1 ? "" : "s"} (${totalChunks} chunks stored in Qdrant).`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload PDFs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          PDFs are parsed, split into chunks, embedded with OpenAI, and stored in
          Qdrant for retrieval when you chat.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Upload className="size-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium">
          {isDragging ? "Drop PDFs here" : "Drag & drop PDFs here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {status && (
        <p
          className={cn(
            "text-center text-sm",
            status.type === "success" ? "text-foreground" : "text-destructive"
          )}
        >
          {status.message}
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
          <ul className="divide-y rounded-lg border">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            disabled={isUploading}
            onClick={handleUpload}
          >
            {isUploading
              ? "Indexing…"
              : `Upload & index ${files.length} PDF${files.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
