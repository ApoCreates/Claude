"use client";
import {
  Tag,
  ListTree,
  Search,
  Images,
  FileText,
  Sparkles,
  Download,
} from "lucide-react";
import CopyButton from "./CopyButton";
import type { ProductAnalysis } from "@/lib/ai/product";

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: any;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-accent" />
          {title}
        </div>
        {action}
      </div>
      <div className="card-bd space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="label">{label}</div>
        <CopyButton value={value} />
      </div>
      <div className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{value}</div>
    </div>
  );
}

export default function ResultPanel({
  analysis,
  live,
  note,
}: {
  analysis: ProductAnalysis;
  live: boolean;
  note?: string;
}) {
  const json = JSON.stringify(analysis, null, 2);

  function downloadJson() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.seo.slug || "product"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const confPct = Math.round(analysis.confidence * 100);

  return (
    <div className="space-y-4">
      {/* Header / identity */}
      <div className="card">
        <div className="card-bd">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="chip">{analysis.category}</span>
                {analysis.brand && <span className="chip">{analysis.brand}</span>}
                <span
                  className={`chip ${
                    confPct >= 75 ? "chip-good" : confPct >= 50 ? "chip-warn" : "chip-bad"
                  }`}
                >
                  {confPct}% confidence
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{analysis.name}</h2>
              <p className="mt-1 text-sm text-muted">{analysis.shortDescription}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <CopyButton value={json} label="Copy JSON" />
              <button onClick={downloadJson} className="btn text-xs py-1">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
          {note && (
            <div className="mt-3 text-xs text-warn bg-warn/10 border border-warn/30 rounded-md px-2.5 py-1.5">
              {note}
            </div>
          )}
        </div>
      </div>

      {/* Title + descriptions */}
      <Section icon={FileText} title="Title & description">
        <Field label="Listing title" value={analysis.title} />
        <Field label="Short description" value={analysis.shortDescription} />
        <Field label="Full description" value={analysis.description} />
      </Section>

      {/* Tags */}
      {analysis.tags.length > 0 && (
        <Section
          icon={Tag}
          title="Tags"
          action={<CopyButton value={analysis.tags.join(", ")} label="Copy all" />}
        >
          <div className="flex flex-wrap gap-1.5">
            {analysis.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Attributes / metadata */}
      {analysis.attributes.length > 0 && (
        <Section icon={ListTree} title="Attributes & metadata">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {analysis.attributes.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5">
                <dt className="text-xs text-muted">{a.label}</dt>
                <dd className="text-sm text-right">{a.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* SEO */}
      <Section
        icon={Search}
        title="SEO optimization"
        action={<CopyButton value={JSON.stringify(analysis.seo, null, 2)} label="Copy SEO" />}
      >
        <Field label="Meta title" value={analysis.seo.metaTitle} />
        <Field label="Meta description" value={analysis.seo.metaDescription} />
        <Field label="URL slug" value={analysis.seo.slug} />
        <Field label="Image alt text" value={analysis.seo.altText} />
        {analysis.seo.keywords.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="label">Keywords</div>
              <CopyButton value={analysis.seo.keywords.join(", ")} label="Copy all" />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {analysis.seo.keywords.map((k) => (
                <span key={k} className="chip">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* SERP preview */}
        <div className="mt-1 rounded-lg border border-border bg-panel2 p-3">
          <div className="label mb-1">Search preview</div>
          <div className="text-accent text-sm leading-snug truncate">
            {analysis.seo.metaTitle || analysis.title}
          </div>
          <div className="text-good/80 text-xs truncate">
            example.com/products/{analysis.seo.slug || "product"}
          </div>
          <div className="text-muted text-xs mt-0.5 line-clamp-2">
            {analysis.seo.metaDescription || analysis.shortDescription}
          </div>
        </div>
      </Section>

      {/* Image suggestions */}
      {analysis.imageSuggestions.length > 0 && (
        <Section icon={Images} title="Recommended product images">
          <p className="text-xs text-muted -mt-1">
            Suggested gallery shots to complete the listing alongside your uploaded photo.
          </p>
          <ol className="space-y-2">
            {analysis.imageSuggestions.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 grid place-items-center rounded-md bg-accent/15 text-accent text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium">{s.shot}</div>
                  <div className="text-xs text-muted">{s.purpose}</div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <div className="flex items-center gap-2 text-xs text-muted pt-1">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        {live ? "Generated live by Claude vision." : "Demo output."} Review before publishing.
      </div>
    </div>
  );
}
