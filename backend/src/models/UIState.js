const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    cssOverride: { type: String, default: "" },
  },
  { _id: false }
);

const SnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

const UIStateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "global" },
    theme: { type: String, default: "light" },
    globalCss: { type: String, default: "" },
    customTheme: { type: mongoose.Schema.Types.Mixed, default: {} },
    sections: { type: [SectionSchema], default: [] },
    globalOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    snapshots: { type: [SnapshotSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UIState", UIStateSchema);
