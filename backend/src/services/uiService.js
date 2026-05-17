const UIState = require("../models/UIState");
const CodeSnippet = require("../models/CodeSnippet");
const { memoryStore, createId } = require("../store/memoryStore");

async function getUIState(dbReady) {
  if (dbReady) {
    let state = await UIState.findOne({ key: "global" });
    if (!state) {
      state = await UIState.create({
        key: "global",
        sections: [
          { id: "navbar", name: "Navbar", visible: true, order: 1, cssOverride: "" },
          { id: "sidebar", name: "Sidebar", visible: true, order: 2, cssOverride: "" },
          {
            id: "calculatorPanels",
            name: "Calculator Panels",
            visible: true,
            order: 3,
            cssOverride: "",
          },
          { id: "footer", name: "Footer", visible: true, order: 4, cssOverride: "" },
        ],
      });
    }
    return state;
  }
  return memoryStore.uiState;
}

async function updateUIState(dbReady, patch) {
  if (dbReady) {
    const current = await getUIState(true);
    Object.assign(current, patch);
    await current.save();
    return current;
  }
  memoryStore.uiState = {
    ...memoryStore.uiState,
    ...patch,
    updatedAt: new Date(),
  };
  return memoryStore.uiState;
}

async function saveSnapshot(dbReady, label, createdBy) {
  if (dbReady) {
    const state = await getUIState(true);
    state.snapshots.unshift({
      label,
      payload: {
        theme: state.theme,
        globalCss: state.globalCss,
        customTheme: state.customTheme,
        sections: state.sections,
        globalOverrides: state.globalOverrides,
      },
      createdBy,
    });
    await state.save();
    return state.snapshots[0];
  }
  const snapshot = {
    id: createId(),
    label,
    payload: {
      theme: memoryStore.uiState.theme,
      globalCss: memoryStore.uiState.globalCss,
      customTheme: memoryStore.uiState.customTheme,
      sections: memoryStore.uiState.sections,
      globalOverrides: memoryStore.uiState.globalOverrides,
    },
    createdBy,
    createdAt: new Date(),
  };
  memoryStore.uiState.snapshots.unshift(snapshot);
  return snapshot;
}

async function restoreSnapshot(dbReady, snapshotId) {
  if (dbReady) {
    const state = await getUIState(true);
    const snap = state.snapshots.id(snapshotId);
    if (!snap) return null;
    Object.assign(state, snap.payload);
    await state.save();
    return state;
  }
  const snap = memoryStore.uiState.snapshots.find((s) => s.id === snapshotId);
  if (!snap) return null;
  memoryStore.uiState = {
    ...memoryStore.uiState,
    ...snap.payload,
    updatedAt: new Date(),
  };
  return memoryStore.uiState;
}

async function listSnippets(dbReady) {
  if (dbReady) return CodeSnippet.find().sort({ createdAt: -1 });
  return memoryStore.codeSnippets.slice().reverse();
}

async function createSnippet(dbReady, payload) {
  if (dbReady) return CodeSnippet.create(payload);
  const snippet = { id: createId(), ...payload, createdAt: new Date() };
  memoryStore.codeSnippets.push(snippet);
  return snippet;
}

module.exports = {
  getUIState,
  updateUIState,
  saveSnapshot,
  restoreSnapshot,
  listSnippets,
  createSnippet,
};
