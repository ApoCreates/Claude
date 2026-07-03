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

/* ---- tiny markdown renderer (headings, bold/italic, lists, code) ---- */
function md(text) {
  const lines = esc(text || "").split("\n");
  let html = "", inList = false;
  const inline = (s) => s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)/);
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (h) {
      if (inList) { html += "</ul>"; inList = false; }
      const n = h[1].length + 1;
      html += `<h${n}>${inline(h[2])}</h${n}>`;
    } else if (li) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(li[1])}</li>`;
    } else if (line.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

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
  if (v === "tasks") loadTasks();
  if (v === "timeline") loadTimeline();
  if (v === "meetings") { loadMeetings(); refreshWatch(); }
  if (v === "routines") loadRoutines();
  if (v === "settings") { loadStatus(); loadConnectors(); loadProfile(); }
}

/* ---- profile ---- */
async function loadProfile() {
  const p = await api("/api/profile");
  $("#profileName").value = p.name || "";
  $("#profileGlossary").value = p.glossary || "";
}
$("#profileSave").addEventListener("click", async () => {
  await api("/api/profile", { method: "POST", body: JSON.stringify({
    name: $("#profileName").value, glossary: $("#profileGlossary").value,
  }) });
  $("#profileStatus").textContent = "Saved ✓ — applies to the next transcription/summary.";
  setTimeout(() => { $("#profileStatus").textContent = ""; }, 4000);
});

/* ---- status ---- */
async function refreshStatus() {
  try {
    const s = await api("/api/status");
    $("#stMode").textContent = s.llm.mode === "local-models" ? "local models" : "offline fallback";
    $("#stMem").textContent = s.memory.total;
    const cap = s.capture;
    $("#captureToggle").textContent = cap.paused ? "paused" : "on";
    $("#stCap").textContent = `${cap.mode}${cap.last ? " · " + (cap.last.app || cap.last.title || "") : ""}`;
    const mw = s.meetingwatch || {};
    const pill = $("#meetingPill");
    if (mw.in_meeting) {
      pill.hidden = false;
      pill.textContent = mw.recording ? `● Recording ${mw.meeting}` : `In ${mw.meeting}`;
    } else pill.hidden = true;
    return s;
  } catch { /* server restarting */ }
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
  $("#chatEmpty")?.remove();
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.innerHTML = `<div class="md">${md(text)}</div>`;
  if (role === "assistant" && text && text !== "thinking…") {
    const btn = document.createElement("button");
    btn.className = "ghost copy-msg";
    btn.textContent = "⧉ Copy";
    btn.onclick = () => copyText(btn, text);
    el.appendChild(btn);
  }
  if (sources && sources.length) {
    const s = document.createElement("div");
    s.className = "sources";
    s.innerHTML = "sources: " + sources.map((h) =>
      `<span class="src" title="${esc(h.excerpt)}">${esc(h.title || h.source || h.kind)}</span>`).join("");
    el.appendChild(s);
  }
  $("#chatLog").appendChild(el);
  el.scrollIntoView({ behavior: "smooth" });
  return el;
}
$("#askForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#askInput").value.trim();
  if (!q) return;
  addMsg("user", q);
  $("#askInput").value = "";
  const thinking = addMsg("assistant", "thinking…");
  thinking.classList.add("spin");
  const res = await api("/api/ask", { method: "POST", body: JSON.stringify({ question: q }) });
  thinking.remove();
  addMsg("assistant", res.answer, res.sources);
  refreshStatus();
});

/* ---- tasks ---- */
async function loadTasks() {
  const showDone = $("#showDone").checked;
  const { tasks } = await api(`/api/tasks?include_done=${showDone}`);
  const open = tasks.filter((t) => !t.done).length;
  $("#taskBadge").textContent = open || "";
  $("#tasks").innerHTML = tasks.map((t) => `
    <div class="card task ${t.done ? "done" : ""}">
      <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${t.id}, this.checked)" />
      <div class="task-text">
        <div>${esc(t.text)}</div>
        <div class="task-meta">
          ${t.owner ? `👤 ${esc(t.owner)} · ` : ""}${t.due ? `📅 ${esc(t.due)} · ` : ""}
          ${t.source && t.source !== "manual" ? `from ${esc(t.source)}` : "added manually"}
        </div>
      </div>
      <button class="del" title="Delete" onclick="deleteTask(${t.id})">✕</button>
    </div>`).join("") ||
    `<div class="empty"><div class="empty-icon">✅</div><p>No open tasks. Action items from recorded meetings appear here automatically.</p></div>`;
}
window.toggleTask = async (id, done) => {
  const fd = new FormData(); fd.append("done", done ? "true" : "false");
  await fetch(`/api/tasks/${id}/toggle`, { method: "POST", body: fd });
  loadTasks();
};
window.deleteTask = async (id) => {
  await api(`/api/tasks/${id}`, { method: "DELETE" });
  loadTasks();
};
$("#taskForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("#taskInput").value.trim();
  if (!text) return;
  await api("/api/tasks", { method: "POST", body: JSON.stringify({ text }) });
  $("#taskInput").value = "";
  loadTasks();
});
$("#showDone").addEventListener("change", loadTasks);

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
      <div class="head"><span class="tag k-${esc(i.kind)}">${esc(i.kind)}</span>
        <span>${esc(i.source || "")} · ${fmtTime(i.ts)}${i.score ? " · " + i.score : ""}</span></div>
      ${i.title ? `<h4>${esc(i.title)}</h4>` : ""}
      <p>${esc(i.excerpt)}</p>
    </div>`).join("") ||
    `<div class="empty"><div class="empty-icon">🕘</div><p>Nothing yet. As you use your Mac, memories appear here.</p></div>`;
}
$("#tlRefresh").addEventListener("click", loadTimeline);
$("#tlHours").addEventListener("change", loadTimeline);
$("#tlSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); loadTimeline(); } });

/* ---- meetings ---- */
async function refreshWatch() {
  const w = await api("/api/meetingwatch");
  const el = $("#watchStatus");
  if (!w.enabled) { el.textContent = "Meeting auto-detection is disabled (LOCALBIRD_MEETING_WATCH=false)"; return; }
  if (w.in_meeting) {
    el.classList.add("live");
    el.textContent = w.recording ? `● In ${w.meeting} — recording notes` : `In ${w.meeting} — not recording`;
  } else {
    el.classList.remove("live");
    el.textContent = `👀 Watching for meetings (Zoom, Teams, Meet, FaceTime…) — mode: ${w.mode}` +
      (w.last_event ? ` · last: ${w.last_event}` : "");
  }
}
/* copy-to-clipboard with feedback */
window.copyText = async (btn, text) => {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = "✓ Copied";
    setTimeout(() => { btn.textContent = old; }, 1500);
  } catch { alert("Copy failed — select and copy manually."); }
};

const meetingCache = {};
async function loadMeetings() {
  const { meetings } = await api("/api/meetings");
  meetings.forEach((m) => { meetingCache[m.id] = m; });
  $("#meetings").innerHTML = meetings.map((m) => `
    <div class="card">
      <div class="head"><span class="tag k-meeting">meeting</span><span>${fmtTime(m.ts)}</span></div>
      <h4>${esc(m.title || "Untitled")}</h4>
      <div class="md">${md(m.summary || "")}</div>
      <div class="actions">
        <button class="ghost" onclick="copyText(this, meetingCache[${m.id}].summary || '')">⧉ Copy summary</button>
        <button class="ghost" onclick="showTranscript(${m.id}, this)">📄 Transcript</button>
        <button class="ghost" onclick="resummarise(${m.id}, this)">↻ Re-summarise</button>
      </div>
      <div class="transcript-box" id="transcript-${m.id}" hidden></div>
    </div>`).join("") ||
    `<div class="empty"><div class="empty-icon">🎙️</div><p>No meetings yet. Join a call and LocalBird will offer to record it.</p></div>`;
}
window.showTranscript = async (id, btn) => {
  const box = $(`#transcript-${id}`);
  if (!box.hidden) { box.hidden = true; return; }
  btn.disabled = true;
  const m = await api(`/api/meetings/${id}`);
  btn.disabled = false;
  box.innerHTML = `
    <div class="actions" style="margin:0 0 8px">
      <button class="ghost" onclick='copyText(this, ${JSON.stringify(m.transcript || "")})'>⧉ Copy transcript</button>
    </div>
    <p class="muted small" style="white-space:pre-wrap">${esc(m.transcript || "(empty)")}</p>`;
  box.hidden = false;
};
window.resummarise = async (id, btn) => {
  btn.disabled = true; btn.textContent = "Summarising…";
  const r = await api(`/api/meetings/${id}/resummarise`, { method: "POST" });
  btn.disabled = false; btn.textContent = "↻ Re-summarise";
  if (r.ok) loadMeetings(); else alert(r.error || "failed");
};
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
  $("#recStatus").textContent = r.ok ? `saved${r.tasks?.length ? ` · ${r.tasks.length} action items → Tasks` : ""}` : (r.error || "error");
  loadMeetings(); loadTasks();
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
  if (r.ok) { $("#pasteTranscript").value = ""; loadMeetings(); loadTasks(); }
});

/* ---- journal ---- */
$("#genJournal").addEventListener("click", async () => {
  $("#journalOut").textContent = "Generating…";
  const r = await api("/api/journal/today", { method: "POST" });
  $("#journalOut").innerHTML = `<h3>${esc(r.date)}</h3>` + md(r.entry) +
    (r.apps?.length ? `<p class="muted small" style="margin-top:14px">Apps: ${r.apps.map((a) => esc(a.app) + " (" + a.count + ")").join(", ")}</p>` : "");
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
      <div class="actions">
        <button class="primary" onclick="runRoutine(${r.id})">Run now</button>
        <button class="ghost" onclick="toggleRoutine(${r.id}, ${r.enabled ? 0 : 1})">${r.enabled ? "Disable" : "Enable"}</button>
        <button class="danger" onclick="deleteRoutine(${r.id})">Delete</button>
      </div>
      ${r.last_output ? `<details style="margin-top:10px"><summary>Last output</summary><div class="md" style="margin-top:8px">${md(r.last_output)}</div></details>` : ""}
    </div>`).join("");
}
window.runRoutine = async (id) => {
  const card = event?.target;
  if (card) { card.disabled = true; card.textContent = "Running…"; }
  await api(`/api/routines/${id}/run`, { method: "POST" });
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

/* ---- connectors ---- */
async function loadConnectors() {
  const c = await api("/api/connectors");
  if (!c.available) {
    $("#connectors").innerHTML = `<div class="conn-row"><span class="conn-dot err"></span> Connectors require macOS.</div>`;
    return;
  }
  if (!c.enabled.length) {
    $("#connectors").innerHTML = `<div class="conn-row"><span class="conn-dot err"></span> No connectors enabled (set LOCALBIRD_CONNECTORS=mail,calendar).</div>`;
    return;
  }
  $("#connectors").innerHTML = c.connectors.map((x) => `
    <div class="conn-row">
      <span class="conn-dot ${x.last_error ? "err" : ""}"></span>
      <b>${esc(x.name)}</b>
      <span class="muted">${x.last_error ? esc(x.last_error) : `${x.synced_total} items synced`}</span>
    </div>`).join("") +
    (c.last_sync ? `<div class="muted small">Last sync: ${fmtTime(c.last_sync)}</div>` : `<div class="muted small">First sync runs ~20s after startup.</div>`);
}
$("#syncNow").addEventListener("click", async () => {
  $("#connectors").textContent = "syncing…";
  await api("/api/connectors/sync", { method: "POST" });
  loadConnectors();
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
loadTasks();
setInterval(refreshStatus, 12000);
setInterval(() => { if ($("#view-meetings").classList.contains("active")) refreshWatch(); }, 10000);
