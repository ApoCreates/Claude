"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, ImageIcon, Loader2, Wand2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductAnalysis } from "@/lib/ai/product";
import ResultPanel from "./ResultPanel";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const MARKETPLACES = [
  "Generic e-commerce",
  "Amazon",
  "Shopify",
  "Etsy",
  "eBay",
  "Google Shopping",
];

type UploadState = {
  dataUrl: string;
  base64: string;
  mediaType: string;
  fileName: string;
};

function readFile(file: File): Promise<UploadState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const comma = dataUrl.indexOf(",");
      const base64 = dataUrl.slice(comma + 1);
      resolve({ dataUrl, base64, mediaType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductStudio({ live }: { live: boolean }) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [hint, setHint] = useState("");
  const [marketplace, setMarketplace] = useState(MARKETPLACES[0]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductAnalysis | null>(null);
  const [resultLive, setResultLive] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError(`Unsupported file type "${file.type || "unknown"}". Use JPEG, PNG, WebP, or GIF.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is larger than 8 MB. Please use a smaller file.");
      return;
    }
    try {
      const state = await readFile(file);
      setUpload(state);
      setResult(null);
      setNote(undefined);
    } catch (e: any) {
      setError(e?.message ?? "Could not read the image.");
    }
  }, []);

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) ingest(item.getAsFile());
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [ingest]);

  async function analyze() {
    if (!upload || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/product/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: upload.base64,
          mediaType: upload.mediaType,
          hint,
          marketplace,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j?.error ?? `Request failed (${r.status})`);
        return;
      }
      setResult(j.analysis);
      setResultLive(Boolean(j.live));
      setNote(j.note);
    } catch (e: any) {
      setError(e?.message ?? "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    setUpload(null);
    setResult(null);
    setError(null);
    setNote(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      {/* Left: input column */}
      <div className="space-y-4 lg:sticky lg:top-6 self-start">
        <div className="card">
          <div className="card-hd">
            <div className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent" /> Product image
            </div>
          </div>
          <div className="card-bd">
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => ingest(e.target.files?.[0])}
            />

            {!upload ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  ingest(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "w-full rounded-xl border-2 border-dashed px-6 py-12 flex flex-col items-center gap-3 text-center transition",
                  dragging
                    ? "border-accent bg-accent/5"
                    : "border-border bg-panel2 hover:border-accent/60"
                )}
              >
                <UploadCloud className="w-8 h-8 text-accent" />
                <div className="text-sm font-medium">Drop an image, click to browse, or paste</div>
                <div className="text-xs text-muted">JPEG, PNG, WebP or GIF · up to 8 MB</div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-border bg-panel2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={upload.dataUrl} alt="Product preview" className="w-full max-h-72 object-contain" />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-md bg-bg/80 border border-border text-muted hover:text-text"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-muted truncate">{upload.fileName}</div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Target marketplace</label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="input mt-1"
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hint (optional)</label>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g. brand name, material, target audience"
                  className="input mt-1"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 text-xs text-bad bg-bad/10 border border-bad/30 rounded-md px-2.5 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!upload || loading}
              className="btn btn-primary w-full justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate listing
                </>
              )}
            </button>
            {!live && (
              <p className="mt-2 text-[11px] text-muted text-center">
                Running in demo mode — set <code>ANTHROPIC_API_KEY</code> for live image analysis.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: results column */}
      <div>
        {result ? (
          <ResultPanel analysis={result} live={resultLive} note={note} />
        ) : (
          <div className="card h-full">
            <div className="card-bd h-full grid place-items-center text-center py-20">
              <div className="max-w-sm space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-accent/10 grid place-items-center">
                  <Wand2 className="w-6 h-6 text-accent" />
                </div>
                <div className="text-sm font-medium">Your generated listing appears here</div>
                <p className="text-xs text-muted">
                  Upload a product photo and generate a name, title, descriptions, tags, attributes,
                  SEO metadata, and a recommended image gallery — ready to publish.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
