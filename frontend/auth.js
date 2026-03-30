const API_BASE = "";

const state = {
  user: null,
  authMode: "login",
  theme: localStorage.getItem("innotalk-theme") || "light"
};

const els = {
  themeToggle: document.getElementById("themeToggle"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  authMessage: document.getElementById("authMessage")
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
  setMessage("");
}

function setMessage(text, tone = "") {
  els.authMessage.textContent = text;
  els.authMessage.className = `mt-4 min-h-6 text-sm ${tone === "error" ? "text-red-500" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300"}`;
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

function redirectToDashboard() {
  window.location.href = "dashboard.html";
}

async function handleRegister(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    setMessage("Creating account...");
    const payload = await request("/api/register", {
      method: "POST",
      body: JSON.stringify(body)
    });
    
    // Store user data in localStorage for demo purposes
    localStorage.setItem("innotalk-user", JSON.stringify(payload.user));
    localStorage.setItem("innotalk-app", JSON.stringify(payload.app));
    
    setMessage("Account created! Redirecting to dashboard...", "success");
    setTimeout(() => redirectToDashboard(), 1500);
    event.currentTarget.reset();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    setMessage("Signing you in...");
    const payload = await request("/api/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
    
    // Store user data in localStorage for demo purposes
    localStorage.setItem("innotalk-user", JSON.stringify(payload.user));
    localStorage.setItem("innotalk-app", JSON.stringify(payload.app));
    
    setMessage("Welcome! Redirecting to dashboard...", "success");
    setTimeout(() => redirectToDashboard(), 1500);
    event.currentTarget.reset();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

// Check if user is already logged in
function checkAuthStatus() {
  const userData = localStorage.getItem("innotalk-user");
  if (userData) {
    redirectToDashboard();
  }
}

els.themeToggle.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
els.loginTab.addEventListener("click", () => setAuthMode("login"));
els.registerTab.addEventListener("click", () => setAuthMode("register"));
els.loginForm.addEventListener("submit", handleLogin);
els.registerForm.addEventListener("submit", handleRegister);

setTheme(state.theme);
setAuthMode("login");
checkAuthStatus();
