const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../.env") });

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";
const dbUri = isProd ? (process.env.MONGO_ATLAS_URI || process.env.MONGO_URI) : (process.env.MONGO_LOCAL_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smarthub");

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  mongoUri: dbUri,
  jwtSecret: required("JWT_SECRET", "dev-change-this-secret"),
  encryptionKey: required(
    "ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef"
  ),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  numVerifyApiKey: process.env.NUMVERIFY_API_KEY || null,
};

module.exports = { config };
