const mongoose = require("mongoose");

const CalculatorSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    tags: [{ type: String }],
    logicJs: { type: String, default: "" },
    uiJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    currentVersion: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Calculator", CalculatorSchema);
