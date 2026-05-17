const mongoose = require("mongoose");

const CodeSnippetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    html: { type: String, default: "" },
    css: { type: String, default: "" },
    js: { type: String, default: "" },
    targetType: {
      type: String,
      enum: ["global", "calculator", "page"],
      default: "global",
    },
    targetId: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    createdBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodeSnippet", CodeSnippetSchema);
