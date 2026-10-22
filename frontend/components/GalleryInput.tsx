"use client";

import { useState } from "react";

import { prepareGalleryFiles } from "@/lib/images";

export default function GalleryInput({
  label,
  disabled,
  className,
  onPick,
  onError,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  onPick: (files: File[]) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <label className={`relative overflow-hidden ${className ?? "btn btn-primary btn-sm"} ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}>
      <span className="pointer-events-none">{busy ? "Leyendo fotos…" : label}</span>
      <input
        className="gallery-input"
        type="file"
        accept="image/*"
        multiple
        disabled={disabled || busy}
        onChange={(event) => {
          const input = event.currentTarget;
          const selected = input.files;
          if (!selected?.length) return;
          setBusy(true);
          prepareGalleryFiles(selected)
            .then((files) => onPick(files))
            .catch((err: unknown) => onError?.(err instanceof Error ? err.message : "No se pudieron leer las fotos"))
            .finally(() => {
              input.value = "";
              setBusy(false);
            });
        }}
      />
    </label>
  );
}
