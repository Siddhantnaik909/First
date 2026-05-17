const mongoose = require("mongoose");

const ConnectorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    environment: {
      type: String,
      enum: ["dev", "staging", "prod", "local"],
      default: "dev",
    },
    connectionStringEncrypted: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Connector", ConnectorSchema);
