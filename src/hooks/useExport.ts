"use client";

import { useCallback, useRef, useState } from "react";

export type ExportState = "idle" | "recording" | "processing";

export function useExport() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<ExportState>("idle");

  const startRecording = useCallback((canvas: HTMLCanvasElement) => {
    if (recorderRef.current) return;

    const stream = canvas.captureStream(30); // 30fps

    // Check for WebM support (not available in Safari)
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : null;

    if (!mimeType) {
      return false; // Fallback to screenshot
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klangfarbe-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
      recorderRef.current = null;
    };

    recorder.start(100); // collect data every 100ms
    recorderRef.current = recorder;
    setState("recording");
    return true;
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      setState("processing");
      recorderRef.current.stop();
    }
  }, []);

  const takeScreenshot = useCallback((canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klangfarbe-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    takeScreenshot,
  };
}
