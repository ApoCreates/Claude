"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseYouTube } from "@/lib/youtube";
import { parseDuration, formatDuration, isEmail } from "@/lib/utils";

type Crew = { name: string; role: string };

const CATEGORY_OPTIONS = ["Narrative", "Documentary / Factual", "Experimental", "Social / Vertical"];
const ROLE_SUGGESTIONS = ["Director", "Producer", "Writer", "Editor", "Sound", "Art / Design"];

export function SubmitForm({ defaultCohort }: { defaultCohort: string }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [youtube, setYoutube] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [cohort, setCohort] = useState(defaultCohort);

  const [teamName, setTeamName] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [crew, setCrew] = useState<Crew[]>([{ name: "", role: "Director" }]);

  const [aiTools, setAiTools] = useState("");
  const [aiDisclosure, setAiDisclosure] = useState("");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yt = useMemo(() => parseYouTube(youtube), [youtube]);
  const durPreview = useMemo(() => {
    const s = parseDuration(duration);
    return s > 0 ? formatDuration(s) : null;
  }, [duration]);

  function setCrewAt(i: number, patch: Partial<Crew>) {
    setCrew((c) => c.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function addCrew() {
    setCrew((c) => [...c, { name: "", role: "" }]);
  }
  function removeCrew(i: number) {
    setCrew((c) => (c.length > 1 ? c.filter((_, idx) => idx !== i) : c));
  }

  function onPoster(file: File | null) {
    setPosterFile(file);
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(file ? URL.createObjectURL(file) : null);
  }

  function validate(): string | null {
    if (!title.trim()) return "Your film needs a title.";
    if (!logline.trim()) return "Add a one-sentence logline.";
    if (!yt) return "Paste a valid YouTube link (standard or Shorts).";
    if (parseDuration(duration) <= 0) return "Add the film's duration (e.g. 1:20).";
    if (!teamName.trim()) return "Add your team or group name.";
    if (!submitterName.trim()) return "Add your name.";
    if (!isEmail(submitterEmail)) return "Add a valid email so we can confirm your entry.";
    if (!crew.some((m) => m.name.trim())) return "Add at least one crew member.";
    return null;
  }

  async function uploadPosterIfAny(): Promise<string | null> {
    if (!posterFile) return posterUrl.trim() || null;
    try {
      const fd = new FormData();
      fd.append("file", posterFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (data && data.url) return data.url as string;
    } catch {
      /* fall back below */
    }
    // storage not configured or failed — use a manual URL if provided
    return posterUrl.trim() || null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      const poster = await uploadPosterIfAny();
      const payload = {
        title: title.trim(),
        logline: logline.trim(),
        youtube_url: youtube.trim(),
        duration_seconds: parseDuration(duration),
        poster_url: poster,
        team_name: teamName.trim(),
        submitter_name: submitterName.trim(),
        submitter_email: submitterEmail.trim(),
        crew: crew.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), role: m.role.trim() || "Crew" })),
        ai_tools: aiTools.trim(),
        ai_disclosure: aiDisclosure.trim(),
        cohort: cohort.trim() || defaultCohort,
        category: category || null,
      };
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.slug) {
        throw new Error(data?.error || "Something went wrong submitting your film.");
      }
      router.push(`/submit/success?slug=${encodeURIComponent(data.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      {error && (
        <div className="border border-dusk bg-dusk/15 px-5 py-4 font-sans text-sm text-on">{error}</div>
      )}

      {/* THE FILM */}
      <fieldset className="space-y-6">
        <Legend num="01">The film</Legend>

        <div>
          <label className="field-label" htmlFor="title">Film title *</label>
          <input id="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Last Lighthouse" maxLength={120} />
        </div>

        <div>
          <label className="field-label" htmlFor="logline">Logline — one sentence *</label>
          <textarea id="logline" className="field" value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="When [character] faces [problem], they must [action] — or [stakes]." maxLength={240} />
          <Hint>{logline.length}/240 — the film in a single sentence.</Hint>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="yt">YouTube link *</label>
            <input id="yt" className="field" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtu.be/… or /shorts/…" />
            <Hint>
              {youtube && !yt && <span className="text-accent2">Not a valid YouTube link yet.</span>}
              {yt && <span className="text-gold">✓ {yt.kind === "short" ? "Vertical Short" : "Standard video"} detected.</span>}
              {!youtube && "Unlisted is fine — we only need to embed it."}
            </Hint>
          </div>
          <div>
            <label className="field-label" htmlFor="dur">Duration *</label>
            <input id="dur" className="field" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1:20" />
            <Hint>{durPreview ? <span className="text-gold">✓ {durPreview}</span> : "mm:ss or seconds. Aim for 60–90s."}</Hint>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="cat">Category</label>
            <select id="cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— Choose one —</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="cohort">Training / cohort</label>
            <input id="cohort" className="field" value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder={defaultCohort} />
            <Hint>Your trainer may have given this a name.</Hint>
          </div>
        </div>

        {/* poster */}
        <div>
          <label className="field-label">Poster — one still</label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <label className="flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden border border-dashed border-on/25 bg-card transition-colors hover:border-accent2 sm:w-64">
              {posterPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreview} alt="Poster preview" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center font-mono text-[10px] uppercase tracking-label text-on/40">
                  Click to upload<br />a poster image
                </span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPoster(e.target.files?.[0] || null)} />
            </label>
            <div className="flex-1">
              <Hint>Optional — if you skip it, we use the film's frame. A Nano Banana render or a frame grab works.</Hint>
              <div className="mt-3">
                <label className="field-label" htmlFor="posterUrl">…or paste a poster URL</label>
                <input id="posterUrl" className="field" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://…" />
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      {/* THE TEAM */}
      <fieldset className="space-y-6">
        <Legend num="02">The team</Legend>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="team">Team / group name *</label>
            <input id="team" className="field" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Group A" />
          </div>
          <div>
            <label className="field-label" htmlFor="sname">Your name *</label>
            <input id="sname" className="field" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} placeholder="Lina Haddad" />
          </div>
          <div>
            <label className="field-label" htmlFor="semail">Your email *</label>
            <input id="semail" type="email" className="field" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>

        <div>
          <label className="field-label">Crew — names &amp; roles *</label>
          <div className="space-y-3">
            {crew.map((m, i) => (
              <div key={i} className="flex gap-3">
                <input
                  className="field flex-1"
                  value={m.name}
                  onChange={(e) => setCrewAt(i, { name: e.target.value })}
                  placeholder="Name"
                  list="role-suggestions"
                />
                <input
                  className="field w-40"
                  value={m.role}
                  onChange={(e) => setCrewAt(i, { role: e.target.value })}
                  placeholder="Role"
                  list="role-suggestions"
                />
                <button
                  type="button"
                  onClick={() => removeCrew(i)}
                  className="shrink-0 border border-on/20 px-3 text-on/50 transition-colors hover:border-dusk hover:text-accent2"
                  aria-label="Remove crew member"
                >
                  ✕
                </button>
              </div>
            ))}
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <button type="button" onClick={addCrew} className="mt-3 font-mono text-[10px] uppercase tracking-label text-accent hover:text-gold">
            + Add crew member
          </button>
        </div>
      </fieldset>

      {/* AI */}
      <fieldset className="space-y-6">
        <Legend num="03">AI &amp; disclosure</Legend>

        <div>
          <label className="field-label" htmlFor="tools">AI toolchain</label>
          <input id="tools" className="field" value={aiTools} onChange={(e) => setAiTools(e.target.value)} placeholder="Image: Nano Banana Pro · Video: Runway Gen-4.5 · Audio: ElevenLabs v3" />
          <Hint>Which tools you used, per stage — image / video / audio.</Hint>
        </div>

        <div>
          <label className="field-label" htmlFor="disc">AI disclosure — one line</label>
          <textarea id="disc" className="field" value={aiDisclosure} onChange={(e) => setAiDisclosure(e.target.value)} placeholder="What was AI-generated, and what wasn't." maxLength={240} />
        </div>
      </fieldset>

      <div className="flex flex-col items-start gap-4 border-t border-on/12 pt-8 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 bg-gold px-8 py-4 font-sans text-sm font-semibold text-surface transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Publishing your page…" : "Submit film & publish page →"}
        </button>
        <p className="font-serif text-sm italic text-on/50">
          We'll build your film's page and email you the moment it's in.
        </p>
      </div>
    </form>
  );
}

function Legend({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <legend className="mb-2 flex w-full items-center gap-4">
      <span className="font-serif text-3xl text-ochre" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30', fontWeight: 300 }}>{num}</span>
      <span className="font-serif text-2xl text-on" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>{children}</span>
      <span className="h-px flex-1 bg-on/12" />
    </legend>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-on/40">{children}</p>;
}
