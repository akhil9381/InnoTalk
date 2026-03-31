const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.resolve(__dirname, "..", "..", "data");
const storeFile = path.join(dataDir, "store.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify({ users: [] }, null, 2));
  }
}

function loadStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storeFile, "utf8"));
}

function saveStore(store) {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getAllUsers() {
  return loadStore().users;
}

function findUserByEmail(email) {
  return getAllUsers().find((user) => user.email === email) || null;
}

function findUserById(id) {
  return getAllUsers().find((user) => user.id === id) || null;
}

function createUser({ name, email, passwordHash, simulation }) {
  const store = loadStore();
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    simulation,
    createdAt: new Date().toISOString()
  };
  store.users.push(user);
  saveStore(store);
  return user;
}

function updateUser(user) {
  const store = loadStore();
  const index = store.users.findIndex((entry) => entry.id === user.id);
  if (index === -1) {
    return null;
  }
  store.users[index] = user;
  saveStore(store);
  return user;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser
};
