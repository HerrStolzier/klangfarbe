"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

interface AudioUploaderProps {
  onFileSelect: (url: string, name: string) => void;
}

export function AudioUploader({ onFileSelect }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("audio/")) return;
      const url = URL.createObjectURL(file);
      onFileSelect(url, file.name);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <motion.label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      animate={{
        borderColor: isDragging ? "rgb(6, 182, 212)" : "rgb(63, 63, 70)",
      }}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-6 py-4 transition-colors hover:border-zinc-500"
    >
      <span className="text-sm text-zinc-400">
        {isDragging
          ? "Hier ablegen..."
          : "Audiodatei hierher ziehen oder klicken"}
      </span>
      <span className="text-xs text-zinc-600">MP3, WAV, OGG, FLAC</span>
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </motion.label>
  );
}
