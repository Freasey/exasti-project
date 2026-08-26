"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ecocycle] render error", error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-flame-500/10 text-flame-400 ring-1 ring-flame-500/20">
          <TriangleAlert className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Ada yang tidak beres
        </h1>
        <p className="mt-2 text-sm text-mist-500">
          Halaman gagal dimuat. Coba muat ulang — kalau masih bermasalah,
          periksa koneksi database di environment.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-mist-600">
            ref: {error.digest}
          </p>
        )}
        <Button className="mt-6" onClick={reset}>
          <RotateCw className="h-4 w-4" />
          Coba lagi
        </Button>
      </div>
    </div>
  );
}
