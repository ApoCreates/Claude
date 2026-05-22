// Lightweight DOM control factory. No framework — keeps the app a static,
// double-clickable site your brother can host on GitHub Pages or itch.io.

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function row(label, control) {
  return el("div", { class: "row" }, [el("label", {}, label), control]);
}

export function slider(label, value, min, max, step, onInput) {
  const out = el("span", { class: "val" }, fmt(value));
  const input = el("input", {
    type: "range", min, max, step, value,
    oninput: (e) => {
      const v = parseFloat(e.target.value);
      out.textContent = fmt(v);
      onInput(v);
    },
  });
  const wrap = el("div", { class: "slider" }, [input, out]);
  return row(label, wrap);
}

export function rangeControl(label, value, min, max, step, onChange) {
  const [lo, hi] = value;
  const outLo = el("span", { class: "val" }, fmt(lo));
  const outHi = el("span", { class: "val" }, fmt(hi));
  const sLo = el("input", { type: "range", min, max, step, value: lo, oninput: (e) => { const v = parseFloat(e.target.value); value[0] = v; outLo.textContent = fmt(v); onChange(value); } });
  const sHi = el("input", { type: "range", min, max, step, value: hi, oninput: (e) => { const v = parseFloat(e.target.value); value[1] = v; outHi.textContent = fmt(v); onChange(value); } });
  return row(label, el("div", { class: "range" }, [
    el("div", { class: "slider" }, [sLo, outLo]),
    el("div", { class: "slider" }, [sHi, outHi]),
  ]));
}

export function selectControl(label, value, options, onChange) {
  const sel = el("select", { onchange: (e) => onChange(e.target.value) },
    options.map((o) => el("option", { value: o, selected: o === value ? "selected" : null }, o)));
  return row(label, sel);
}

export function checkbox(label, value, onChange) {
  const cb = el("input", { type: "checkbox", onchange: (e) => onChange(e.target.checked) });
  cb.checked = value;
  return row(label, cb);
}

export function vectorControl(label, value, min, max, step, onChange) {
  const inputs = value.map((v, i) =>
    el("input", { type: "number", value: v, min, max, step, class: "vec",
      oninput: (e) => { value[i] = parseFloat(e.target.value) || 0; onChange(value); } }));
  return row(label, el("div", { class: "vec-group" }, inputs));
}

export function colorField(label, rgb, onChange) {
  const input = el("input", { type: "color", value: rgbToHex(rgb),
    oninput: (e) => { const c = hexToRgb(e.target.value); rgb[0] = c[0]; rgb[1] = c[1]; rgb[2] = c[2]; onChange(rgb); } });
  return row(label, input);
}

// Editable ColorSequence: each stop = time + color, with add/remove.
export function colorSequenceEditor(label, stops, onChange) {
  const list = el("div", { class: "seq" });
  function rebuild() {
    list.innerHTML = "";
    stops.forEach((s, i) => {
      const time = el("input", { type: "number", min: 0, max: 1, step: 0.01, value: s.t, class: "seq-t",
        oninput: (e) => { s.t = clamp01(parseFloat(e.target.value)); onChange(); } });
      const color = el("input", { type: "color", value: rgbToHex(s.c),
        oninput: (e) => { const c = hexToRgb(e.target.value); s.c = c; onChange(); } });
      const del = el("button", { class: "mini", title: "remove",
        onclick: () => { if (stops.length > 2) { stops.splice(i, 1); rebuild(); onChange(); } } }, "x");
      list.appendChild(el("div", { class: "seq-row" }, [time, color, del]));
    });
  }
  const add = el("button", { class: "mini add",
    onclick: () => { stops.push({ t: 0.5, c: stops[stops.length - 1].c.slice() }); stops.sort((a, b) => a.t - b.t); rebuild(); onChange(); } }, "+ stop");
  rebuild();
  return el("div", { class: "row col" }, [el("label", {}, label), list, add]);
}

// Editable NumberSequence: each keypoint = time + value (+ optional envelope).
export function numberSequenceEditor(label, kps, max, onChange) {
  const list = el("div", { class: "seq" });
  function rebuild() {
    list.innerHTML = "";
    kps.forEach((k, i) => {
      const time = el("input", { type: "number", min: 0, max: 1, step: 0.01, value: k.t, class: "seq-t",
        oninput: (e) => { k.t = clamp01(parseFloat(e.target.value)); onChange(); } });
      const val = el("input", { type: "number", min: 0, max, step: 0.01, value: k.v, class: "seq-v",
        oninput: (e) => { k.v = parseFloat(e.target.value) || 0; onChange(); } });
      const del = el("button", { class: "mini", title: "remove",
        onclick: () => { if (kps.length > 2) { kps.splice(i, 1); rebuild(); onChange(); } } }, "x");
      list.appendChild(el("div", { class: "seq-row" }, [time, val, del]));
    });
  }
  const add = el("button", { class: "mini add",
    onclick: () => { kps.push({ t: 0.5, v: kps[kps.length - 1].v }); kps.sort((a, b) => a.t - b.t); rebuild(); onChange(); } }, "+ key");
  rebuild();
  return el("div", { class: "row col" }, [el("label", {}, label), list, add]);
}

export function section(title, controls) {
  return el("div", { class: "section" }, [el("h3", {}, title), ...controls]);
}

// --- helpers ---
function fmt(v) { return (Math.round(v * 100) / 100).toString(); }
function clamp01(v) { return Math.max(0, Math.min(1, isNaN(v) ? 0 : v)); }
function rgbToHex(rgb) {
  return "#" + rgb.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}
function hexToRgb(hex) {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
