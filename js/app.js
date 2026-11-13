/* TriageDesk — application controller */
"use strict";

const COMMON_SYMPTOMS = ["fever", "cough", "headache", "abdo_pain", "vomiting", "diarrhea", "sore_throat", "rash", "breathless", "chest_pain", "dizziness", "joint_pain"];
const QUICK_ADD_EXTRA = ["chills", "fatigue", "nausea", "runny_nose", "ear_pain", "back_pain", "itching", "low_mood", "palpitations", "wheezing", "bloating", "heartburn"];

const state = {
  lang: "en",
  screen: "welcome",
  text: "",
  symptoms: new Set(),
  age: "adult",
  pregnant: false,
  chronic: new Set(),
  severity: "moderate",
  duration: "d1_3",
  result: null,
  intakeId: "",
  llmStatus: "off",
  llmBusy: false,
};

function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }
function lbl(obj) { return state.lang === "bn" ? obj.bn : obj.en; }
function esc(s) { return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function byId(id) { return SYMPTOMS.find(s => s.id === id); }

// ---------- header / footer ----------
function renderShell() {
  document.getElementById("brand").textContent = t("title");
  document.getElementById("tagline").textContent = t("tagline");
  document.getElementById("langBtn").textContent = t("lang_btn");
  document.getElementById("disclaimerBar").textContent = t("disclaimer");
  document.getElementById("footerNote").textContent = t("footer");
  const ls = document.getElementById("llmState");
  if (ls) ls.textContent = state.llmStatus === "on" ? t("llm_on") : t("llm_off");
}

// ---------- screens ----------
function screenWelcome() {
  return `
  <section class="card hero">
    <div class="hero-badge">AI × Healthcare</div>
    <h2>${t("title")}</h2>
    <p class="lead">${t("tagline")}</p>
    <button id="startBtn" class="btn primary lg">${t("start")}</button>
    <div class="how">
      <h3>${t("how_title")}</h3>
      <ol>
        <li>${t("how1")}</li>
        <li>${t("how2")}</li>
        <li>${t("how3")}</li>
      </ol>
    </div>
  </section>`;
}

function screenContext() {
  const ageOpts = AGE_BANDS.map(a => `<label class="opt"><input type="radio" name="age" value="${a.id}" ${state.age === a.id ? "checked" : ""}/><span>${lbl(a)}</span></label>`).join("");
  const chronicChips = CHRONIC.map(c => `<button class="chip ${state.chronic.has(c.id) ? "on" : ""}" data-chronic="${c.id}">${lbl(c)}</button>`).join("");
  return `
  <section class="card">
    <h2>${t("ctx_title")}</h2>
    <div class="field">
      <span class="flabel">${t("ctx_age")}</span>
      <div class="optrow">${ageOpts}</div>
    </div>
    <div class="field">
      <span class="flabel">${t("ctx_preg")}</span>
      <div class="optrow">
        <button class="chip ${state.pregnant ? "on" : ""}" id="pregYes">${t("ctx_yes")}</button>
        <button class="chip ${!state.pregnant ? "on" : ""}" id="pregNo">${t("ctx_no")}</button>
      </div>
    </div>
    <div class="field">
      <span class="flabel">${t("ctx_chronic")}</span>
      <div class="optrow wrap">${chronicChips}</div>
    </div>
    <div class="actions"><button id="ctxNext" class="btn primary">${t("ctx_next")}</button></div>
  </section>`;
}

function symptomChipBtn(s, extraClass = "") {
  const on = state.symptoms.has(s.id);
  return `<button class="chip sym ${on ? "on" : ""} ${extraClass}" data-sym="${s.id}">${lbl(s)}</button>`;
}

function screenSymptoms() {
  const common = COMMON_SYMPTOMS.map(id => symptomChipBtn(byId(id))).join("");
  const extra = QUICK_ADD_EXTRA.map(id => symptomChipBtn(byId(id))).join("");
  const rest = SYMPTOMS.filter(s => !COMMON_SYMPTOMS.includes(s.id) && s.sys !== "obs").map(s => symptomChipBtn(s, "grid-chip")).join("");
  const obs = state.pregnant ? SYMPTOMS.filter(s => s.sys === "obs").map(s => symptomChipBtn(s)).join("") : "";
  const sel = [...state.symptoms].map(id => symptomChipBtn(byId(id))).join("");
  const sevOpts = SEVERITIES.map(v => `<button class="chip ${state.severity === v.id ? "on" : ""}" data-sev="${v.id}">${lbl(v)}</button>`).join("");
  const durOpts = DURATIONS.map(v => `<button class="chip ${state.duration === v.id ? "on" : ""}" data-dur="${v.id}">${lbl(v)}</button>`).join("");
  return `
  <section class="card">
    <h2>${t("sym_title")}</h2>
    <div class="field">
      <span class="flabel">${t("sym_text_label")}</span>
      <textarea id="symText" rows="3" placeholder="${t("sym_text_ph_bn") || t("sym_text_ph_en")}">${esc(state.text)}</textarea>
      <div class="row-between">
        <button id="llmBtn" class="btn ghost sm">${t("llm_try")}</button>
        <span class="hint" id="llmState2"></span>
      </div>
    </div>
    <div class="field">
      <span class="flabel">${t("sym_detected")}</span>
      <div class="optrow wrap" id="detected">${sel || `<span class="hint">${t("sym_detected_none")}</span>`}</div>
    </div>
    <div class="field">
      <span class="flabel">${t("sym_quick")}</span>
      <div class="optrow wrap">${common}${extra}${obs}</div>
    </div>
    <details class="more">
      <summary>${t("sym_more")}</summary>
      <div class="optrow wrap grid">${rest}</div>
    </details>
    <div class="field">
      <span class="flabel">${t("sym_severity")}</span>
      <div class="optrow">${sevOpts}</div>
    </div>
    <div class="field">
      <span class="flabel">${t("sym_duration")}</span>
      <div class="optrow">${durOpts}</div>
    </div>
    <div class="actions row-between">
      <button id="clearBtn" class="btn ghost sm">${t("sym_clear")}</button>
      <button id="analyzeBtn" class="btn primary">${t("sym_analyze")}</button>
    </div>
  </section>`;
}

function screenAnalysis() {
  return `<section class="card center"><div class="pulse"></div><p id="anaMsg">${t("ana_running")}</p></section>`;
}

function screenResults() {
  const b = BANDS[state.result.band];
  const dept = DEPARTMENTS[state.result.dept];
  const reasons = state.result.fired.length
    ? state.result.fired.map(f => {
        const rb = BANDS[f.band];
        return `<li><span class="dot" style="background:${rb.color}"></span><div><strong>${state.lang === "bn" ? rb.bn : rb.en}</strong> — ${state.lang === "bn" ? f.reason_bn : f.reason_en}</div></li>`;
      }).join("")
    : `<li class="none">${t("res_none")}</li>`;
  const emergency = state.result.band === "emergency";
  return `
  <section class="card">
    <h2>${t("res_title")}</h2>
    <div class="band" style="border-color:${b.color}">
      <div class="band-head" style="background:${b.color}"><span class="band-label">${t("res_band")}</span><span class="band-value">${lbl(b)}</span></div>
      ${emergency ? `<a class="call999" href="tel:999">${t("emergency_call")}</a>` : ""}
      <div class="band-body">
        <p><strong>${t("res_next")}:</strong> ${state.lang === "bn" ? b.action_bn : b.action_en}</p>
        <p><strong>${t("res_dept")}:</strong> ${lbl(dept)}</p>
      </div>
    </div>
    <div class="field">
      <span class="flabel">${t("res_why")}</span>
      <ul class="reasons">${reasons}</ul>
    </div>
    ${state.result.band === "self_care" ? `<p class="note">${t("res_selfcare_note")}</p>` : ""}
    <div class="actions row-between">
      <button id="restartBtn" class="btn ghost">${t("res_restart")}</button>
      <button id="printBtn" class="btn primary">${t("res_print")}</button>
    </div>
  </section>`;
}

function screenSummary() {
  const b = BANDS[state.result.band];
  const dept = DEPARTMENTS[state.result.dept];
  const date = new Date();
  const id = state.intakeId;
  const symList = [...state.symptoms].map(id2 => lbl(byId(id2))).join("; ");
  const reasons = state.result.fired.map(f => `• ${state.lang === "bn" ? f.reason_bn : f.reason_en}`).join("\n");
  return `
  <section class="card">
    <h2>${t("sum_title")}</h2>
    <div class="print-zone">
      <div class="pz-head">${t("sum_clinic_copy")}</div>
      <table class="pz">
        <tr><th>${t("sum_id")}</th><td>${esc(id)}</td><th>${t("sum_date")}</th><td>${date.toLocaleString(state.lang === "bn" ? "bn-BD" : "en-GB")}</td></tr>
        <tr><th>${t("sum_age")}</th><td>${lbl(AGE_BANDS.find(a => a.id === state.age))}${state.pregnant ? " · " + t("ctx_yes") + " (" + t("ctx_preg") + ")" : ""}</td><th>${t("sum_urgency")}</th><td><span class="pz-band" style="color:${b.color}">${lbl(b)}</span></td></tr>
        <tr><th>${t("sum_complaint")}</th><td colspan="3">${esc(state.text) || "—"}</td></tr>
        <tr><th>${t("sum_symptoms")}</th><td colspan="3">${esc(symList) || "—"}</td></tr>
        <tr><th>${t("sum_dept")}</th><td colspan="3">${lbl(dept)}</td></tr>
        <tr><th>${t("sum_reasons")}</th><td colspan="3" class="pre">${esc(reasons) || "—"}</td></tr>
      </table>
      <div class="pz-foot">${t("sum_note")}</div>
    </div>
    <div class="actions row-between">
      <button id="sumBack" class="btn ghost">${t("sum_back")}</button>
      <button id="doPrint" class="btn primary">${t("res_print")}</button>
    </div>
  </section>`;
}

function render() {
  renderShell();
  const el = document.getElementById("main");
  switch (state.screen) {
    case "welcome": el.innerHTML = screenWelcome(); wireWelcome(); break;
    case "context": el.innerHTML = screenContext(); wireContext(); break;
    case "symptoms": el.innerHTML = screenSymptoms(); wireSymptoms(); break;
    case "analysis": el.innerHTML = screenAnalysis(); runAnalysis(); break;
    case "results": el.innerHTML = screenResults(); wireResults(); break;
    case "summary": el.innerHTML = screenSummary(); wireSummary(); break;
  }
  el.scrollTop = 0; window.scrollTo(0, 0);
}

// ---------- wiring ----------
function wireWelcome() {
  document.getElementById("startBtn").onclick = () => { state.screen = "context"; render(); };
}
function wireContext() {
  document.querySelectorAll("input[name=age]").forEach(r => r.onchange = e => state.age = e.target.value);
  document.getElementById("pregYes").onclick = () => { state.pregnant = true; render(); };
  document.getElementById("pregNo").onclick = () => { state.pregnant = false; render(); };
  document.querySelectorAll("[data-chronic]").forEach(c => c.onclick = () => {
    const id = c.getAttribute("data-chronic");
    state.chronic.has(id) ? state.chronic.delete(id) : state.chronic.add(id);
    render();
  });
  document.getElementById("ctxNext").onclick = () => { state.screen = "symptoms"; render(); };
}
function toggleSym(id) { state.symptoms.has(id) ? state.symptoms.delete(id) : state.symptoms.add(id); render(); }

function wireSymptoms() {
  const ta = document.getElementById("symText");
  ta.oninput = e => { state.text = e.target.value; };
  ta.onblur = () => {
    const found = extractSymptoms(state.text);
    const prevSize = state.symptoms.size;
    found.forEach(id => state.symptoms.add(id));
    if (state.symptoms.size !== prevSize) render();
  };
  document.querySelectorAll("[data-sym]").forEach(c => c.onclick = () => toggleSym(c.getAttribute("data-sym")));
  document.querySelectorAll("[data-sev]").forEach(c => c.onclick = () => { state.severity = c.getAttribute("data-sev"); render(); });
  document.querySelectorAll("[data-dur]").forEach(c => c.onclick = () => { state.duration = c.getAttribute("data-dur"); render(); });
  document.getElementById("clearBtn").onclick = () => { state.symptoms.clear(); state.text = ""; render(); };
  document.getElementById("analyzeBtn").onclick = () => {
    const found = extractSymptoms(state.text);
    found.forEach(id => state.symptoms.add(id));
    if (state.symptoms.size === 0) { alert(t("sym_detected_none")); return; }
    state.screen = "analysis"; render();
  };
  document.getElementById("llmBtn").onclick = llmEnhance;
  const llmState2 = document.getElementById("llmState2");
  if (llmState2) llmState2.textContent = state.llmStatus === "on" ? t("llm_on") : t("llm_off");
}

function runAnalysis() {
  // Brief staged reveal — the actual engine result is computed up-front; the
  // animation only stages when each step is DISPLAYED (honest UI, no fake timers on logic).
  state.result = evaluate(state);
  state.intakeId = "TD-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Date.now()).slice(-4);
  const steps = 2 + Math.min(4, state.result.fired.length);
  let i = 0;
  const iv = setInterval(() => {
    i += 1;
    if (i >= steps) {
      clearInterval(iv);
      const msg = document.getElementById("anaMsg");
      if (msg) msg.textContent = t("ana_done");
      setTimeout(() => { state.screen = "results"; render(); }, 350);
    }
  }, 260);
}

function wireResults() {
  document.getElementById("restartBtn").onclick = resetAll;
  document.getElementById("printBtn").onclick = () => { state.screen = "summary"; render(); };
}
function wireSummary() {
  document.getElementById("sumBack").onclick = () => { state.screen = "results"; render(); };
  document.getElementById("doPrint").onclick = () => window.print();
}
function resetAll() {
  state.screen = "welcome"; state.symptoms.clear(); state.text = "";
  state.chronic.clear(); state.pregnant = false; state.severity = "moderate";
  state.duration = "d1_3"; state.result = null;
  render();
}

// ---------- optional LLM enhancement (BYO endpoint; runs from this browser) ----------
function loadLLM() {
  try { return JSON.parse(localStorage.getItem("triagedesk_llm") || "{}"); } catch { return {}; }
}
async function llmEnhance() {
  const cfg = loadLLM();
  if (!cfg.endpoint || !cfg.model) { openSettings(); return; }
  state.llmBusy = true;
  try {
    const symptomMenu = SYMPTOMS.map(s => `${s.id} = EN:"${s.en}" BN:"${s.bn}"`).join("\n");
    const res = await fetch(cfg.endpoint.replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cfg.key ? { Authorization: "Bearer " + cfg.key } : {}) },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: "You map a patient's complaint to symptom IDs from the menu. Reply ONLY a JSON array of IDs. Ignore negated symptoms (e.g. 'no cough')." },
          { role: "user", content: `Menu:\n${symptomMenu}\n\nComplaint: ${state.text}\n\nJSON array of symptom IDs:` },
        ],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const m = String(data.choices[0].message.content).match(/\[[\s\S]*\]/);
    const ids = m ? JSON.parse(m[0]) : [];
    let added = 0;
    for (const id of ids) if (byId(id) && !state.symptoms.has(id)) { state.symptoms.add(id); added += 1; }
    if (added > 0) render();
  } catch (e) {
    alert(t("llm_fail") + " (" + e.message + ")");
  }
  state.llmBusy = false;
}

function openSettings() {
  const cfg = loadLLM();
  const el = document.getElementById("settingsModal");
  el.querySelector("#cfgEndpoint").value = cfg.endpoint || "";
  el.querySelector("#cfgKey").value = cfg.key || "";
  el.querySelector("#cfgModel").value = cfg.model || "";
  el.classList.add("open");
}
function closeSettings() { document.getElementById("settingsModal").classList.remove("open"); }
function saveSettings() {
  const cfg = {
    endpoint: document.getElementById("cfgEndpoint").value.trim(),
    key: document.getElementById("cfgKey").value.trim(),
    model: document.getElementById("cfgModel").value.trim(),
  };
  localStorage.setItem("triagedesk_llm", JSON.stringify(cfg));
  state.llmStatus = cfg.endpoint && cfg.model ? "on" : "off";
  closeSettings(); render();
}

// ---------- boot ----------
function boot() {
  const fails = selfTest();
  if (fails.length) {
    console.warn("[TriageDesk] self-test failures:", fails);
    const f = document.getElementById("selftest");
    if (f) { f.textContent = "self-test FAILED: " + fails.length; f.classList.add("bad"); }
  } else {
    const f = document.getElementById("selftest");
    if (f) f.textContent = "engine self-test: 16/16 OK";
  }
  const cfg = loadLLM();
  state.llmStatus = cfg.endpoint && cfg.model ? "on" : "off";
  document.getElementById("langBtn").onclick = () => { state.lang = state.lang === "en" ? "bn" : "en"; render(); };
  document.getElementById("settingsBtn").onclick = openSettings;
  document.getElementById("settingsClose").onclick = closeSettings;
  document.getElementById("settingsSave").onclick = saveSettings;
  render();
}
document.addEventListener("DOMContentLoaded", boot);
