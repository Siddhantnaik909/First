const mongoose = require("mongoose");

const CalculatorVersionSchema = new mongoose.Schema(
  {
    calculatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calculator",
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    logicJs: { type: String, default: "" },
    uiJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: "" },
    changedBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalculatorVersion", CalculatorVersionSchema);
