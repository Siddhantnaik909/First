const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { memoryStore, createId } = require("../store/memoryStore");
const { config } = require("../config/env");

/**
 * Find user by username.
 */
async function findUserByUsername(username, dbReady) {
  if (dbReady) return User.findOne({ username });
  return memoryStore.users.find((u) => u.username === username) || null;
}

/**
 * Find user by email.
 */
async function findUserByEmail(email, dbReady) {
  if (dbReady) return User.findOne({ email });
  return memoryStore.users.find((u) => u.email === email) || null;
}

/**
 * Create a new user.
 */
async function createUser(payload, dbReady) {
  if (dbReady) return User.create(payload);
  const user = { id: createId(), ...payload, createdAt: new Date() };
  memoryStore.users.push(user);
  return user;
}

/**
 * List all users (without password field).
 */
async function listUsers(dbReady) {
  if (dbReady) return User.find({}, "username name role email createdAt");
  return memoryStore.users.map(({ passwordHash, password, ...rest }) => rest);
}

/**
 * Sign a JWT token with consistent flat payload.
 * Token payload: { id, role, email, name }
 */
function signToken(user) {
  const id = String(user.id || user._id);
  return jwt.sign(
    { id, role: user.role || 'user', email: user.email || '', name: user.name || '' },
    config.jwtSecret,
    { expiresIn: "24h" }
  );
}

// ✅ FIX P1-7: REMOVED ensureDefaultAdmin()
// Default admin must be created manually via: node backend/seed-admin.js <password>
// This prevents automatic admin123 account creation on fresh deployments.

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  listUsers,
  signToken,
};