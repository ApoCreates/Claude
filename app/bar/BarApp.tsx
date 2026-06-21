"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Loader2,
  Wine,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  type Bottle,
  type Category,
  BOTTLES,
  findBottle,
  COMMON_SIZES,
} from "@/lib/bar/bottles";
import { estimate, fmtMl, fmtPct, levelTone } from "@/lib/bar/estimate";
import BottleGauge from "@/components/bar/BottleGauge";
import BottleCombobox from "@/components/bar/BottleCombobox";
import { cn } from "@/lib/utils";

// A neutral placeholder shape, used only to render the gauge before the user
// has confirmed which bottle it is.
const GENERIC: Bottle = {
  id: "__generic__",
  brand: "Unknown",
  name: "bottle",
  category: "Whiskey",
  volumeMl: 750,
  color: "#7c8aa0",
  fullY: 0.67,
  silhouette: [
    { y: 0, r: 0.92 },
    { y: 0.05, r: 1.0 },
    { y: 0.55, r: 1.0 },
    { y: 0.63, r: 0.96 },
    { y: 0.72, r: 0.7 },
    { y: 0.8, r: 0.42 },
    { y: 0.93, r: 0.3 },
    { y: 1.0, r: 0.34 },
  ],
};

type VisionResult = {
  bottleId: string | null;
  guessName: string;
  category: string;
  fillFraction: number;
  confidence: number;
  notes: string;
};

type InventoryItem = {
  key: string;
  bottleId: string;
  brand: string;
  name: string;
  category: Category;
  color: string;
  fillFraction: number;
  volumeMl: number;
  addedAt: number;
};

const STORAGE_KEY = "pourcheck_inventory_v1";

function toneClass(t: "good" | "warn" | "bad") {
  return t === "good" ? "text-good" : t === "warn" ? "text-warn" : "text-bad";
}

export default function BarApp() {
  // Capture
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current analysis
  const [result, setResult] = useState<VisionResult | null>(null);
  const [live, setLive] = useState(true);
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [fill, setFill] = useState(0.5);
  const [volumeMl, setVolumeMl] = useState(750);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Load + persist inventory.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInventory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch {
      /* ignore */
    }
  }, [inventory]);

  async function onFile(file: File) {
    setError(null);
    setResult(null);
    setBottle(null);
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    void analyze(dataUrl, file.type);
  }

  async function analyze(dataUrl: string, mediaType: string) {
    setAnalyzing(true);
    setError(null);
    try {
      const base64 = dataUrl.split(",")[1] ?? "";
      const res = await fetch("/api/bar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Analysis failed");
      const r = data.result as VisionResult;
      setResult(r);
      setLive(Boolean(data.live));
      const matched = findBottle(r.bottleId || undefined) || null;
      setBottle(matched);
      setFill(r.fillFraction);
      setVolumeMl(matched?.volumeMl ?? 750);
    } catch (e: any) {
      setError(e?.message || "Something went wrong analyzing the photo.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setBottle(null);
    setError(null);
    setFill(0.5);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function addToInventory() {
    if (!bottle) return;
    const item: InventoryItem = {
      key: `${bottle.id}-${Date.now()}`,
      bottleId: bottle.id,
      brand: bottle.brand,
      name: bottle.name,
      category: bottle.category,
      color: bottle.color,
      fillFraction: fill,
      volumeMl,
      addedAt: Date.now(),
    };
    setInventory((inv) => [item, ...inv]);
    reset();
  }

  const gaugeBottle = bottle ?? GENERIC;
  const est = useMemo(
    () => (bottle ? estimate(bottle, fill, volumeMl) : null),
    [bottle, fill, volumeMl]
  );

  const totals = useMemo(() => {
    let ml = 0;
    let shots = 0;
    let low = 0;
    for (const it of inventory) {
      const b = findBottle(it.bottleId);
      if (!b) continue;
      const e = estimate(b, it.fillFraction, it.volumeMl);
      ml += e.remainingMl;
      shots += e.shots;
      if (e.volumeFraction < 0.15) low += 1;
    }
    return { count: inventory.length, ml, shots, low };
  }, [inventory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
            <Wine size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">PourCheck</h1>
            <p className="text-sm text-muted">
              Snap a bottle → know exactly how much is left.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "chip",
            live ? "chip-good" : "text-warn border-warn/30 bg-warn/10"
          )}
          title={live ? "AI vision is connected" : "AI vision offline — manual mode"}
        >
          <Sparkles size={12} /> {live ? "AI vision on" : "Manual mode"}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: capture + result */}
        <div className="lg:col-span-3 space-y-6">
          {/* Capture card */}
          {!result && (
            <div className="card">
              <div className="card-hd">
                <span className="font-medium">1 · Add a bottle</span>
              </div>
              <div className="card-bd">
                {!preview ? (
                  <DropZone
                    onPick={() => fileRef.current?.click()}
                    onCamera={() => cameraRef.current?.click()}
                    onDrop={onFile}
                  />
                ) : (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Bottle"
                      className="mx-auto max-h-72 rounded-lg border border-border object-contain"
                    />
                    {analyzing && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted">
                        <Loader2 size={16} className="animate-spin" />
                        Reading the liquid level…
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
                        <AlertTriangle size={15} /> {error}
                      </div>
                    )}
                    <button onClick={reset} className="btn w-full">
                      <RotateCcw size={15} /> Use a different photo
                    </button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="card">
              <div className="card-hd">
                <span className="font-medium">2 · Result</span>
                <button onClick={reset} className="btn !px-2 !py-1 text-xs">
                  <RotateCcw size={13} /> New scan
                </button>
              </div>
              <div className="card-bd">
                <div className="flex flex-col gap-6 sm:flex-row">
                  {/* Gauge */}
                  <div className="flex flex-col items-center">
                    <BottleGauge bottle={gaugeBottle} fillFraction={fill} />
                    <div className="mt-2 text-center">
                      <div className="text-3xl font-semibold tracking-tight">
                        {est ? fmtPct(est.volumeFraction) : fmtPct(fill)}
                      </div>
                      <div className="text-xs text-muted">remaining</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    {bottle ? (
                      <div>
                        <div className="text-lg font-medium leading-tight">{bottle.brand}</div>
                        <div className="text-sm text-muted">{bottle.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="chip">{bottle.category}</span>
                          {live && (
                            <span
                              className={cn(
                                "chip",
                                result.confidence >= 0.66
                                  ? "chip-good"
                                  : result.confidence >= 0.33
                                    ? "text-warn border-warn/30 bg-warn/10"
                                    : "chip-bad"
                              )}
                            >
                              {Math.round(result.confidence * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
                        <AlertTriangle size={14} className="mr-1 inline" />
                        {live
                          ? `Not sure which bottle this is${
                              result.guessName ? ` (looks like ${result.guessName})` : ""
                            } — pick it below for exact ml & shots.`
                          : result.guessName}
                      </div>
                    )}

                    {/* Numbers */}
                    {est && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <Stat label="Volume" value={fmtMl(est.remainingMl)} />
                        <Stat label="Shots left" value={`${Math.floor(est.shots)}`} />
                        <Stat
                          label="Level"
                          value={fmtPct(est.volumeFraction)}
                          tone={levelTone(est.volumeFraction)}
                        />
                      </div>
                    )}

                    {/* Change bottle */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        {bottle ? "Wrong bottle? Change it" : "Choose the bottle"}
                      </label>
                      <BottleCombobox
                        value={bottle}
                        onChange={(b) => {
                          setBottle(b);
                          setVolumeMl(b.volumeMl);
                        }}
                        placeholder="Type the first letters…"
                      />
                    </div>

                    {/* Bottle size */}
                    {bottle && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Bottle size
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_SIZES.map((s) => (
                            <button
                              key={s.ml}
                              onClick={() => setVolumeMl(s.ml)}
                              className={cn(
                                "rounded-md border px-2 py-1 text-xs",
                                volumeMl === s.ml
                                  ? "border-accent/50 bg-accent/10 text-accent"
                                  : "border-border bg-panel2 text-muted hover:text-text"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fine-tune level */}
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-medium text-muted">
                          Fine-tune the liquid level
                        </label>
                        <span className="text-xs tabular-nums text-muted">
                          {Math.round(fill * 100)}% height
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(fill * 100)}
                        onChange={(e) => setFill(Number(e.target.value) / 100)}
                        className="w-full accent-brand"
                      />
                    </div>

                    {result.notes && (
                      <p className="text-xs italic text-muted">{result.notes}</p>
                    )}

                    <button
                      onClick={addToInventory}
                      disabled={!bottle}
                      className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={16} /> Add to inventory
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-hd">
              <span className="font-medium">Inventory</span>
              {inventory.length > 0 && (
                <button
                  onClick={() => setInventory([])}
                  className="text-xs text-muted hover:text-bad"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="card-bd space-y-3">
              {inventory.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing here yet. Scan a bottle and add it to start tracking your bar.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="Bottles" value={`${totals.count}`} />
                    <Stat label="Total" value={fmtMl(totals.ml)} />
                    <Stat label="Shots" value={`${Math.floor(totals.shots)}`} />
                  </div>
                  {totals.low > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
                      <AlertTriangle size={14} /> {totals.low} bottle
                      {totals.low > 1 ? "s" : ""} running low (under 15%).
                    </div>
                  )}
                  <ul className="space-y-2">
                    {inventory.map((it) => {
                      const b = findBottle(it.bottleId) ?? GENERIC;
                      const e = estimate(b, it.fillFraction, it.volumeMl);
                      const tone = levelTone(e.volumeFraction);
                      return (
                        <li
                          key={it.key}
                          className="flex items-center gap-3 rounded-lg border border-border bg-panel2 p-2"
                        >
                          <BottleGauge
                            bottle={b}
                            fillFraction={it.fillFraction}
                            width={34}
                            height={70}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{it.brand}</div>
                            <div className="truncate text-xs text-muted">{it.name}</div>
                            <div className="mt-0.5 text-xs">
                              <span className={cn("font-medium", toneClass(tone))}>
                                {fmtPct(e.volumeFraction)}
                              </span>{" "}
                              <span className="text-muted">
                                · {fmtMl(e.remainingMl)} · {Math.floor(e.shots)} shots
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setInventory((inv) => inv.filter((x) => x.key !== it.key))
                            }
                            className="text-muted hover:text-bad"
                            aria-label="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-bd text-xs text-muted">
              <p className="mb-1 font-medium text-text">How it works</p>
              PourCheck reads the liquid surface in your photo and converts that height
              into volume using each bottle&apos;s real silhouette — so a tapered shoulder
              doesn&apos;t fool the estimate. {BOTTLES.length} common bottles are built in;
              correct the match anytime with the search box.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div className="rounded-lg border border-border bg-panel2 px-2 py-2">
      <div
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "good" && "text-good",
          tone === "warn" && "text-warn",
          tone === "bad" && "text-bad"
        )}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function DropZone({
  onPick,
  onCamera,
  onDrop,
}: {
  onPick: () => void;
  onCamera: () => void;
  onDrop: (f: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onDrop(f);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        over ? "border-accent bg-accent/5" : "border-border"
      )}
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-panel2 text-muted">
        <Wine size={24} />
      </div>
      <p className="text-sm text-text">Drop a bottle photo here</p>
      <p className="mb-4 text-xs text-muted">or use one of the options below</p>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <button onClick={onCamera} className="btn btn-primary">
          <Camera size={16} /> Take a photo
        </button>
        <button onClick={onPick} className="btn">
          <Upload size={16} /> Upload image
        </button>
      </div>
    </div>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
