const { randomUUID } = require("crypto");

const memoryStore = {
  users: [],
  categories: [],
  calculators: [],
  calculatorVersions: [],
  uiState: {
    id: "global",
    key: "global",
    theme: "light",
    globalCss: "",
    customTheme: {},
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
    globalOverrides: {},
    snapshots: [],
  },
  connectors: [],
  codeSnippets: [],
  auditLogs: [],
  serverLogs: [
    '[2024-01-15T10:30:00Z] Server started on port 3000',
    '[2024-01-15T10:30:01Z] MongoDB connected successfully',
    '[2024-01-15T10:30:02Z] Admin panel APIs initialized',
    '[ADMIN] FileService loaded - File manager active'
  ],
  activeSessions: []
};

function createId() {
  return randomUUID();
}

module.exports = { memoryStore, createId };
