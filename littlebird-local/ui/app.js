const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const api = async (path, opts = {}) => {
  const r = await fetch(path, {
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
    ...opts,
  });
  return r.json();
};
const fmtTime = (ts) => new Date(ts * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const esc = (s) => (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* ---- navigation ---- */
$$(".nav").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".nav").forEach((b) => b.classList.remove("active"));
    $$(".view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    $(`#view-${btn.dataset.view}`).classList.add("active");
    onView(btn.dataset.view);
  })
);
function onView(v) {
  if (v === "timeline") loadTimeline();
  if (v === "meetings") loadMeetings();
  if (v === "routines") loadRoutines();
  if (v === "settings") loadStatus();
}

/* ---- status ---- */
async function refreshStatus() {
  const s = await api("/api/status");
  $("#stMode").textContent = s.llm.mode === "local-models" ? "local models" : "offline fallback";
  $("#stMem").textContent = s.memory.total;
  const cap = s.capture;
  $("#captureToggle").textContent = cap.paused ? "paused" : "on";
  $("#stCap").textContent = `${cap.mode}${cap.last ? " · " + (cap.last.app || cap.last.title || "") : ""}`;
  return s;
}
async function loadStatus() {
  const s = await api("/api/status");
  $("#statusJson").textContent = JSON.stringify(s, null, 2);
}
$("#captureToggle").addEventListener("click", async () => {
  const paused = $("#captureToggle").textContent === "on";
  await api(paused ? "/api/capture/pause" : "/api/capture/resume", { method: "POST" });
  refreshStatus();
});

/* ---- chat ---- */
function addMsg(role, text, sources) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.innerHTML = esc(text).replace(/\n/g, "<br>");
  if (sources && sources.length) {
    const s = document.createElement("div");
    s.className = "sources";
    s.innerHTML = "sources: " + sources.map((h) =>
      `<span class="src" title="${esc(h.excerpt)}">${esc(h.source || h.kind)}</span>`).join("");
    el.appendChild(s);
  }
  $("#chatLog").appendChild(el);
  el.scrollIntoView({ behavior: "smooth" });
}
$("#askForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#askInput").value.trim();
  if (!q) return;
  addMsg("user", q);
  $("#askInput").value = "";
  const thinking = document.createElement("div");
  thinking.className = "msg assistant spin";
  thinking.textContent = "thinking…";
  $("#chatLog").appendChild(thinking);
  const res = await api("/api/ask", { method: "POST", body: JSON.stringify({ question: q }) });
  thinking.remove();
  addMsg("assistant", res.answer, res.sources);
  refreshStatus();
});

/* ---- timeline ---- */
async function loadTimeline() {
  const hours = $("#tlHours").value;
  const q = $("#tlSearch").value.trim();
  let items;
  if (q) {
    const r = await api("/api/search", { method: "POST", body: JSON.stringify({ query: q }) });
    items = r.results.map((x) => ({ ...x, excerpt: x.text.slice(0, 240) }));
  } else {
    items = (await api(`/api/timeline?hours=${hours}`)).items;
  }
  $("#timeline").innerHTML = items.map((i) => `
    <div class="card">
      <div class="head"><span class="tag">${esc(i.kind)}</span>
        <span>${esc(i.source || "")} · ${fmtTime(i.ts)}${i.score ? " · " + i.score : ""}</span></div>
      ${i.title ? `<h4>${esc(i.title)}</h4>` : ""}
      <p>${esc(i.excerpt)}</p>
    </div>`).join("") || `<p class="muted">Nothing yet. As you use your Mac, memories appear here.</p>`;
}
$("#tlRefresh").addEventListener("click", loadTimeline);
$("#tlHours").addEventListener("change", loadTimeline);
$("#tlSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") loadTimeline(); });

/* ---- meetings ---- */
async function loadMeetings() {
  const { meetings } = await api("/api/meetings");
  $("#meetings").innerHTML = meetings.map((m) => `
    <div class="card">
      <div class="head"><span class="tag">meeting</span><span>${fmtTime(m.ts)}</span></div>
      <h4>${esc(m.title || "Untitled")}</h4>
      <p>${esc((m.summary || "").slice(0, 500))}</p>
    </div>`).join("") || `<p class="muted">No meetings yet.</p>`;
}
$("#recStart").addEventListener("click", async () => {
  const r = await api("/api/meetings/record/start", { method: "POST" });
  if (!r.ok) return alert(r.error);
  $("#recStart").disabled = true; $("#recStop").disabled = false;
  $("#recStatus").textContent = "recording…";
});
$("#recStop").addEventListener("click", async () => {
  $("#recStatus").textContent = "transcribing…";
  const fd = new FormData();
  const r = await fetch("/api/meetings/record/stop", { method: "POST", body: fd }).then((x) => x.json());
  $("#recStart").disabled = false; $("#recStop").disabled = true;
  $("#recStatus").textContent = r.ok ? "saved" : (r.error || "error");
  loadMeetings();
});
$("#audioFile").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  $("#recStatus").textContent = "transcribing upload…";
  const fd = new FormData(); fd.append("file", f);
  const r = await fetch("/api/meetings/upload", { method: "POST", body: fd }).then((x) => x.json());
  $("#recStatus").textContent = r.ok ? "saved" : (r.error || "error");
  loadMeetings();
});
$("#pasteBtn").addEventListener("click", async () => {
  const t = $("#pasteTranscript").value.trim(); if (!t) return;
  const r = await api("/api/meetings/transcript", { method: "POST", body: JSON.stringify({ transcript: t }) });
  if (r.ok) { $("#pasteTranscript").value = ""; loadMeetings(); }
});

/* ---- journal ---- */
$("#genJournal").addEventListener("click", async () => {
  $("#journalOut").textContent = "Generating…";
  const r = await api("/api/journal/today", { method: "POST" });
  $("#journalOut").innerHTML = `<h3>${esc(r.date)}</h3>` + esc(r.entry).replace(/\n/g, "<br>") +
    (r.apps?.length ? `<p class="muted" style="margin-top:14px">Apps: ${r.apps.map((a) => esc(a.app) + " (" + a.count + ")").join(", ")}</p>` : "");
});

/* ---- routines ---- */
async function loadRoutines() {
  const { routines } = await api("/api/routines");
  $("#routines").innerHTML = routines.map((r) => `
    <div class="card">
      <div class="head"><span class="tag">${esc(r.cadence)} ${String(r.hour).padStart(2,"0")}:${String(r.minute).padStart(2,"0")}</span>
        <span>${r.enabled ? "enabled" : "disabled"}${r.last_run ? " · last " + fmtTime(r.last_run) : ""}</span></div>
      <h4>${esc(r.name)}</h4>
      <p>${esc(r.prompt)}</p>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="primary" onclick="runRoutine(${r.id})">Run now</button>
        <button class="ghost" onclick="toggleRoutine(${r.id}, ${r.enabled ? 0 : 1})">${r.enabled ? "Disable" : "Enable"}</button>
        <button class="danger" onclick="deleteRoutine(${r.id})">Delete</button>
      </div>
      ${r.last_output ? `<details style="margin-top:10px"><summary>Last output</summary><p style="margin-top:8px">${esc(r.last_output).replace(/\n/g,"<br>")}</p></details>` : ""}
    </div>`).join("");
}
window.runRoutine = async (id) => {
  const r = await api(`/api/routines/${id}/run`, { method: "POST" });
  alert(r.output ? r.output.slice(0, 600) : "done");
  loadRoutines();
};
window.toggleRoutine = async (id, enabled) => {
  const fd = new FormData(); fd.append("enabled", enabled ? "true" : "false");
  await fetch(`/api/routines/${id}/toggle`, { method: "POST", body: fd });
  loadRoutines();
};
window.deleteRoutine = async (id) => {
  if (!confirm("Delete routine?")) return;
  await api(`/api/routines/${id}`, { method: "DELETE" });
  loadRoutines();
};
$("#routineForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  await api("/api/routines", { method: "POST", body: JSON.stringify({
    name: f.name.value, prompt: f.prompt.value, cadence: f.cadence.value,
    hour: +f.hour.value, minute: +f.minute.value,
  }) });
  f.reset(); loadRoutines();
});

/* ---- images ---- */
$("#imgForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const p = $("#imgPrompt").value.trim(); if (!p) return;
  $("#imgStatus").textContent = "Generating…";
  const r = await api("/api/images", { method: "POST", body: JSON.stringify({ prompt: p }) });
  if (!r.ok) { $("#imgStatus").textContent = r.error; return; }
  $("#imgStatus").textContent = "";
  const img = document.createElement("img");
  img.src = `/api/images/file?path=${encodeURIComponent(r.path)}`;
  img.title = p;
  $("#gallery").prepend(img);
});

/* ---- settings / data ---- */
$("#forgetHour").addEventListener("click", async () => {
  if (!confirm("Forget everything from the last hour?")) return;
  const fd = new FormData(); fd.append("hours", "1");
  const r = await fetch("/api/capture/forget", { method: "POST", body: fd }).then((x) => x.json());
  alert(`Deleted ${r.deleted} memories`); refreshStatus();
});
$("#wipeAll").addEventListener("click", async () => {
  if (!confirm("Delete ALL memory permanently?")) return;
  await api("/api/wipe", { method: "POST" });
  alert("All memory deleted"); refreshStatus();
});

/* ---- boot ---- */
refreshStatus();
setInterval(refreshStatus, 15000);
