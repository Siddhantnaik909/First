const mongoose = require("mongoose");
const { config } = require("./env");

async function connectDb() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.warn(
      `MongoDB unavailable (${error.message}). Running in local-memory fallback mode.`
    );
    return false;
  }
}

module.exports = { connectDb };
