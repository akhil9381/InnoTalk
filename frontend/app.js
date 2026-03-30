const API_BASE = "";

const state = {
  app: null,
  user: null,
  authMode: "login",
  theme: localStorage.getItem("innotalk-theme") || "light"
};

const els = {
  authView: document.getElementById("authView"),
  appView: document.getElementById("appView"),
  themeToggle: document.getElementById("themeToggle"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  authMessage: document.getElementById("authMessage"),
  appMessage: document.getElementById("appMessage"),
  logoutButton: document.getElementById("logoutButton"),
  advanceButton: document.getElementById("advanceButton"),
  resetButton: document.getElementById("resetButton"),
  exportButton: document.getElementById("exportButton"),
  founderName: document.getElementById("founderName"),
  founderEmail: document.getElementById("founderEmail"),
  currentStageName: document.getElementById("currentStageName"),
  verdictPill: document.getElementById("verdictPill"),
  progressValue: document.getElementById("progressValue"),
  statsGrid: document.getElementById("statsGrid"),
  phaseList: document.getElementById("phaseList"),
  historyList: document.getElementById("historyList"),
  stageTitle: document.getElementById("stageTitle"),
  stageType: document.getElementById("stageType"),
  stageSummary: document.getElementById("stageSummary"),
  stageOutputs: document.getElementById("stageOutputs"),
  stageTasks: document.getElementById("stageTasks"),
  stageInsight: document.getElementById("stageInsight"),
  trendSummary: document.getElementById("trendSummary"),
  fundingMatches: document.getElementById("fundingMatches"),
  decisionCallout: document.getElementById("decisionCallout"),
  crisisBadge: document.getElementById("crisisBadge"),
  crisisIntro: document.getElementById("crisisIntro"),
  crisisVoices: document.getElementById("crisisVoices"),
  boardScore: document.getElementById("boardScore"),
  boardQuestions: document.getElementById("boardQuestions"),
  boardFeedback: document.getElementById("boardFeedback"),
  readinessBadge: document.getElementById("readinessBadge"),
  reportArchitecture: document.getElementById("reportArchitecture"),
  reportMistakes: document.getElementById("reportMistakes"),
  reportRoadmap: document.getElementById("reportRoadmap")
};

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("innotalk-theme", theme);
}

function setAuthMode(mode) {
  state.authMode = mode;
  els.loginTab.className = `tab-button rounded-full px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-teal-700/10 text-teal-700 dark:text-teal-300" : "bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-300"}`;
  els.registerTab.className = `tab-button rounded-full px-4 py-2 text-sm font-semibold ${mode === "register" ? "bg-teal-700/10 text-teal-700 dark:text-teal-300" : "bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-300"}`;
  els.loginForm.classList.toggle("hidden", mode !== "login");
  els.loginForm.classList.toggle("grid", mode === "login");
  els.registerForm.classList.toggle("hidden", mode !== "register");
  els.registerForm.classList.toggle("grid", mode === "register");
  setMessage("auth", "");
}

function setMessage(target, text, tone = "") {
  const el = target === "auth" ? els.authMessage : els.appMessage;
  el.textContent = text;
  el.className = `mt-4 min-h-6 text-sm ${tone === "error" ? "text-red-500" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300"}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : payload.error || "Request failed.");
  }

  return payload;
}

function getSimulation() {
  return state.app?.simulation;
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "inline-flex rounded-full bg-teal-700/10 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-300";
  tag.textContent = text;
  return tag;
}

function getVerdictClasses(label) {
  if (label === "Go") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
  if (label === "Conditional") return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
  if (label === "No-Go") return "bg-red-500/15 text-red-600 dark:text-red-300";
  return "bg-teal-700/10 text-teal-700 dark:text-teal-300";
}

function renderAuthState() {
  const isAuthed = Boolean(state.user);
  els.authView.classList.toggle("hidden", isAuthed);
  els.appView.classList.toggle("hidden", !isAuthed);
}

function renderStats() {
  const simulation = getSimulation();
  const metrics = [
    ["Budget", simulation.budget, "Current deployment runway across the active venture simulation."],
    ["Trust", simulation.trust, "Confidence from communities, partners, and institutional stakeholders."],
    ["Impact", simulation.impact, "Expected measurable value produced by the solution pathway."],
    ["Risk", simulation.risk, "Lower is better. Tracks strategic, product, and compliance uncertainty."],
    ["Readiness", simulation.readiness, "Composite execution readiness for investors and grant evaluators."]
  ];

  els.statsGrid.innerHTML = "";
  metrics.forEach(([label, value, copy]) => {
    const node = document.createElement("article");
    node.className = "rounded-[26px] border border-white/50 bg-white/80 p-5 shadow-panel backdrop-blur dark:border-white/10 dark:bg-slate-900/85";
    node.innerHTML = `
      <p class="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">${label}</p>
      <strong class="mt-3 block text-4xl font-extrabold">${value}%</strong>
      <p class="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">${copy}</p>
      <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <span class="block h-full rounded-full bg-gradient-to-r from-teal-600 to-sky-400" style="width:${value}%"></span>
      </div>
    `;
    els.statsGrid.appendChild(node);
  });
}

function renderPhaseList() {
  const simulation = getSimulation();
  const template = document.getElementById("phaseItemTemplate");
  els.phaseList.innerHTML = "";

  state.app.phases.forEach((phase, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const step = node.querySelector(".phase-step");
    step.textContent = index + 1;
    node.querySelector(".phase-title").textContent = phase.title;
    node.querySelector(".phase-subtitle").textContent = phase.subtitle;

    if (index === simulation.activePhaseIndex) {
      node.classList.add("bg-teal-300/15");
    } else if (index < simulation.activePhaseIndex) {
      step.classList.remove("bg-white/10");
      step.classList.add("bg-gradient-to-br", "from-emerald-400", "to-teal-400", "text-slate-950");
    }

    node.addEventListener("click", async () => {
      try {
        setMessage("app", "Opening selected phase...");
        await mutateSimulation("/api/simulation/jump", { phaseIndex: index }, "Phase updated.");
      } catch (error) {
        setMessage("app", error.message, "error");
      }
    });

    els.phaseList.appendChild(node);
  });
}

function renderHistory() {
  const template = document.getElementById("historyItemTemplate");
  els.historyList.innerHTML = "";

  [...getSimulation().history].reverse().slice(0, 7).forEach((entry) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const date = new Date(entry.timestamp);
    node.querySelector(".history-time").textContent = Number.isNaN(date.getTime())
      ? entry.timestamp
      : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    node.querySelector(".history-title").textContent = entry.title;
    node.querySelector(".history-body").textContent = entry.body;
    els.historyList.appendChild(node);
  });
}

function renderStage() {
  const simulation = getSimulation();
  const phase = state.app.phases[simulation.activePhaseIndex];

  els.founderName.textContent = state.user.name;
  els.founderEmail.textContent = state.user.email;
  els.currentStageName.textContent = phase.shortLabel;
  els.progressValue.textContent = `${simulation.activePhaseIndex + 1} / ${state.app.phases.length}`;
  els.verdictPill.textContent = simulation.verdict;
  els.verdictPill.className = `mt-2 inline-flex rounded-full px-3 py-2 text-sm font-bold ${getVerdictClasses(simulation.verdict)}`;
  els.stageTitle.textContent = phase.title;
  els.stageType.textContent = phase.type;
  els.stageSummary.textContent = phase.summary;

  els.stageOutputs.innerHTML = "";
  phase.outputs.forEach((output) => els.stageOutputs.appendChild(createTag(output)));

  els.stageTasks.innerHTML = "";
  phase.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = task;
    els.stageTasks.appendChild(li);
  });

  els.stageInsight.textContent = phase.insight;
}

function renderIntelligence() {
  const simulation = getSimulation();
  const phase = state.app.phases[simulation.activePhaseIndex];
  els.trendSummary.textContent = phase.trendSummary;
  els.fundingMatches.innerHTML = "";
  phase.fundingMatches.forEach((match) => els.fundingMatches.appendChild(createTag(match)));
  els.decisionCallout.textContent = phase.decisionCallout;
  els.readinessBadge.textContent = `${simulation.readiness}% readiness`;
}

function renderCrisis() {
  const crisis = getSimulation().crisis;
  els.crisisBadge.textContent = crisis.level.toUpperCase();
  els.crisisBadge.className = `inline-flex rounded-full px-4 py-2 text-sm font-bold ${crisis.level === "critical" ? "bg-red-500/15 text-red-600 dark:text-red-300" : crisis.level === "elevated" ? "bg-amber-500/15 text-amber-600 dark:text-amber-300" : "bg-teal-700/10 text-teal-700 dark:text-teal-300"}`;
  els.crisisIntro.textContent = crisis.intro;
  els.crisisVoices.innerHTML = "";

  const template = document.getElementById("voiceTemplate");
  crisis.voices.forEach((voice) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".voice-role").textContent = voice.role;
    node.querySelector(".voice-stance").textContent = voice.stance;
    node.querySelector(".voice-copy").textContent = voice.copy;
    els.crisisVoices.appendChild(node);
  });
}

function renderBoardroom() {
  const boardroom = getSimulation().boardroom;
  els.boardScore.textContent = `${boardroom.score.toFixed(1)} / 10`;
  els.boardQuestions.innerHTML = "";
  boardroom.questions.forEach((question) => {
    const item = document.createElement("div");
    item.className = "rounded-3xl bg-slate-200/60 p-4 text-sm leading-7 dark:bg-white/5";
    item.textContent = question;
    els.boardQuestions.appendChild(item);
  });
  els.boardFeedback.textContent = boardroom.feedback;
}

function renderReport() {
  const report = getSimulation().report;
  els.reportArchitecture.textContent = report.architecture;
  els.reportMistakes.textContent = report.mistakes;
  els.reportRoadmap.textContent = report.roadmap;
}

function renderApp() {
  renderAuthState();
  if (!state.user || !state.app) return;
  renderStats();
  renderPhaseList();
  renderHistory();
  renderStage();
  renderIntelligence();
  renderCrisis();
  renderBoardroom();
  renderReport();
}

async function loadBootstrap() {
  const payload = await request("/api/bootstrap", { method: "GET", headers: {} });
  state.app = payload.app;
  state.user = payload.user;
  renderApp();
}

async function mutateSimulation(path, body, successMessage) {
  const payload = await request(path, {
    method: "POST",
    body: JSON.stringify(body || {})
  });
  state.app = payload.app;
  state.user = payload.user;
  renderApp();
  setMessage("app", successMessage, "success");
}

async function handleRegister(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    setMessage("auth", "Creating account...");
    const payload = await request("/api/register", {
      method: "POST",
      body: JSON.stringify(body)
    });
    state.app = payload.app;
    state.user = payload.user;
    renderApp();
    setMessage("app", "Account created. Your simulation workspace is ready.", "success");
    event.currentTarget.reset();
  } catch (error) {
    setMessage("auth", error.message, "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    setMessage("auth", "Signing you in...");
    const payload = await request("/api/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
    state.app = payload.app;
    state.user = payload.user;
    renderApp();
    setMessage("app", "Welcome back. Your simulation has been restored.", "success");
    event.currentTarget.reset();
  } catch (error) {
    setMessage("auth", error.message, "error");
  }
}

async function handleLogout() {
  try {
    await request("/api/logout", { method: "POST", body: JSON.stringify({}) });
    state.user = null;
    state.app = null;
    renderAuthState();
    setAuthMode("login");
    setMessage("auth", "You have been logged out.", "success");
  } catch (error) {
    setMessage("app", error.message, "error");
  }
}

async function handleExport() {
  try {
    setMessage("app", "Generating export...");
    const response = await fetch(`${API_BASE}/api/simulation/export`, {
      credentials: "include"
    });
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Export failed.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "innotalk-smart-report.txt";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("app", "Export complete.", "success");
  } catch (error) {
    setMessage("app", error.message, "error");
  }
}

els.themeToggle.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
els.loginTab.addEventListener("click", () => setAuthMode("login"));
els.registerTab.addEventListener("click", () => setAuthMode("register"));
els.loginForm.addEventListener("submit", handleLogin);
els.registerForm.addEventListener("submit", handleRegister);
els.logoutButton.addEventListener("click", handleLogout);
els.advanceButton.addEventListener("click", async () => {
  try {
    setMessage("app", "Advancing simulation...");
    await mutateSimulation("/api/simulation/advance", {}, "Simulation advanced.");
  } catch (error) {
    setMessage("app", error.message, "error");
  }
});
els.resetButton.addEventListener("click", async () => {
  try {
    setMessage("app", "Resetting simulation...");
    await mutateSimulation("/api/simulation/reset", {}, "Simulation reset.");
  } catch (error) {
    setMessage("app", error.message, "error");
  }
});
els.exportButton.addEventListener("click", handleExport);

setTheme(state.theme);
setAuthMode("login");
loadBootstrap().catch(() => {
  renderAuthState();
  setMessage("auth", "Create an account or sign in to enter the simulation.");
});
