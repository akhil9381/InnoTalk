const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const {
  PHASES,
  createBaseSimulation,
  serializeSimulation,
  advanceSimulation,
  jumpSimulation,
  createExport
} = require("./config/simulation");
const { findUserByEmail, findUserById, createUser, updateUser } = require("./store/fileStore");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const COOKIE_NAME = "innotalk_token";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "..", "..", "frontend")));

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function serializeUserApp(user) {
  return {
    user: sanitizeUser(user),
    app: {
      phases: PHASES,
      simulation: serializeSimulation(user.simulation)
    }
  };
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Authentication required." });
  }
}

app.get("/api/bootstrap", async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.json({ user: null, app: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.json({ user: null, app: null });
    }

    return res.json(serializeUserApp(user));
  } catch (_error) {
    return res.json({ user: null, app: null });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 8) {
      return res.status(400).json({
        error: "Name, email, and a password of at least 8 characters are required."
      });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({
      name,
      email,
      passwordHash,
      simulation: createBaseSimulation()
    });

    res.cookie(COOKIE_NAME, signToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json(serializeUserApp(user));
  } catch (_error) {
    return res.status(500).json({ error: "Unable to register right now." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.cookie(COOKIE_NAME, signToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json(serializeUserApp(user));
  } catch (_error) {
    return res.status(500).json({ error: "Unable to login right now." });
  }
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

app.post("/api/simulation/advance", requireAuth, async (req, res) => {
  advanceSimulation(req.user.simulation);
  updateUser(req.user);
  return res.json(serializeUserApp(req.user));
});

app.post("/api/simulation/reset", requireAuth, async (req, res) => {
  req.user.simulation = createBaseSimulation();
  req.user.simulation.history.push({
    title: "Session reset",
    body: "All simulation modules returned to the starting configuration.",
    timestamp: new Date().toISOString()
  });
  updateUser(req.user);
  return res.json(serializeUserApp(req.user));
});

app.post("/api/simulation/jump", requireAuth, async (req, res) => {
  const phaseIndex = Number(req.body.phaseIndex);
  if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= PHASES.length) {
    return res.status(400).json({ error: "Invalid phase index." });
  }

  jumpSimulation(req.user.simulation, phaseIndex);
  updateUser(req.user);
  return res.json(serializeUserApp(req.user));
});

app.get("/api/simulation/export", requireAuth, (req, res) => {
  const exportText = createExport(req.user);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="innotalk-smart-report.txt"');
  return res.send(exportText);
});

app.get("*", (_req, res) => {
  return res.sendFile(path.resolve(__dirname, "..", "..", "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`InnoTalk backend running on http://127.0.0.1:${PORT}`);
});
