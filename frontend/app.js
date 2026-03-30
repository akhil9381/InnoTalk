const API_BASE = "";

const state = {
  app: null,
  user: null,
  theme: localStorage.getItem("innotalk-theme") || "light"
};

const els = {
  appView: document.getElementById("appView"),
  themeToggle: document.getElementById("themeToggle"),
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

function setMessage(text, tone = "") {
  els.appMessage.textContent = text;
  els.appMessage.className = `mt-4 min-h-6 text-sm ${tone === "error" ? "text-red-500" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300"}`;
}

function redirectToLogin() {
  window.location.href = "login.html";
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
  if (label === "Go") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30";
  if (label === "Conditional") return "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30";
  if (label === "No-Go") return "bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-300 border border-red-300 dark:border-red-400/30";
  return "bg-teal-100 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300 border border-teal-300 dark:border-teal-400/30";
}

function renderAuthState() {
  const isAuthed = Boolean(state.user);
  if (!isAuthed) {
    redirectToLogin();
  }
  els.appView.classList.remove("hidden");
}

function renderStats() {
  const simulation = getSimulation();
  const metrics = [
    ["Budget", simulation.budget, "Deployment runway"],
    ["Trust", simulation.trust, "Stakeholder confidence"],
    ["Impact", simulation.impact, "Expected outcome value"],
    ["Risk", simulation.risk, "Uncertainty level"],
    ["Readiness", simulation.readiness, "Execution readiness"]
  ];

  els.statsGrid.innerHTML = "";
  metrics.forEach(([label, value, copy]) => {
    const node = document.createElement("article");
    node.className = "stat-card";
    node.innerHTML = `
      <p class="stat-label">${label}</p>
      <div class="stat-value">${value}%</div>
      <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">${copy}</p>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <span class="block h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500" style="width:${value}%"></span>
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
  els.verdictPill.className = `inline-flex rounded-full px-3 py-1 text-xs font-bold border ${getVerdictClasses(simulation.verdict)}`;
  els.stageTitle.textContent = phase.title;
  els.stageType.textContent = phase.type;
  els.stageSummary.textContent = phase.summary;

  els.stageOutputs.innerHTML = "";
  phase.outputs.forEach((output) => els.stageOutputs.appendChild(createTag(output)));

  els.stageTasks.innerHTML = "";
  phase.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300";
    li.innerHTML = `<span class="mt-0.5 text-teal-500 font-bold">✓</span><span>${task}</span>`;
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
  els.crisisBadge.className = `inline-flex rounded-full px-4 py-2 text-sm font-bold border ${crisis.level === "critical" ? "bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-300 border-red-300 dark:border-red-400/30" : crisis.level === "elevated" ? "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border-amber-300 dark:border-amber-400/30" : "bg-teal-100 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300 border-teal-300 dark:border-teal-400/30"}`;
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
    item.className = "rounded-2xl border border-purple-200 dark:border-purple-400/20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-400/10 dark:to-pink-400/10 p-4 text-sm leading-7 text-purple-900 dark:text-purple-100";
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

function loadUserData() {
  const userData = localStorage.getItem("innotalk-user");
  const appData = localStorage.getItem("innotalk-app");
  
  if (userData && appData) {
    state.user = JSON.parse(userData);
    state.app = JSON.parse(appData);
    renderApp();
  } else {
    redirectToLogin();
  }
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

async function handleLogout() {
  try {
    await request("/api/logout", { method: "POST", body: JSON.stringify({}) });
  } catch (error) {
    // Continue with logout even if API call fails
  }
  
  // Clear localStorage
  localStorage.removeItem("innotalk-user");
  localStorage.removeItem("innotalk-app");
  
  // Redirect to login
  redirectToLogin();
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
els.logoutButton.addEventListener("click", handleLogout);
els.advanceButton.addEventListener("click", async () => {
  try {
    setMessage("Advancing simulation...");
    await mutateSimulation("/api/simulation/advance", {}, "Simulation advanced.");
  } catch (error) {
    setMessage(error.message, "error");
  }
});
els.resetButton.addEventListener("click", async () => {
  try {
    setMessage("Resetting simulation...");
    await mutateSimulation("/api/simulation/reset", {}, "Simulation reset.");
  } catch (error) {
    setMessage(error.message, "error");
  }
});
els.exportButton.addEventListener("click", handleExport);

setTheme(state.theme);
loadUserData();
