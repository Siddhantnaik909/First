const express = require("express");
const { authRequired, allowRoles } = require("../middleware/auth");
const uiService = require("../services/uiService");
const { writeAudit } = require("../services/auditService");

const router = express.Router();

router.get("/state", authRequired, async (req, res, next) => {
  try {
    const state = await uiService.getUIState(req.app.locals.dbReady);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.patch("/state", authRequired, allowRoles("admin", "editor"), async (req, res, next) => {
  try {
    const state = await uiService.updateUIState(req.app.locals.dbReady, req.body);
    await writeAudit(req.app.locals.dbReady, {
      actor: req.user.username,
      role: req.user.role,
      action: "ui.state.update",
      entityType: "uiState",
      entityId: state.id || String(state._id),
      before: null,
      after: req.body,
    });
    req.app.locals.io.emit("ui.updated");
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/snapshots",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const snap = await uiService.saveSnapshot(
        req.app.locals.dbReady,
        req.body.label || `Snapshot ${new Date().toISOString()}`,
        req.user.username
      );
      req.app.locals.io.emit("ui.updated");
      res.status(201).json(snap);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/restore/:snapshotId",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const state = await uiService.restoreSnapshot(
        req.app.locals.dbReady,
        req.params.snapshotId
      );
      if (!state) return res.status(404).json({ error: "snapshot not found" });
      req.app.locals.io.emit("ui.updated");
      res.json(state);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/snippets", authRequired, async (req, res, next) => {
  try {
    const rows = await uiService.listSnippets(req.app.locals.dbReady);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/snippets",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const row = await uiService.createSnippet(req.app.locals.dbReady, {
        ...req.body,
        createdBy: req.user.username,
      });
      await writeAudit(req.app.locals.dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "ui.snippet.create",
        entityType: "codeSnippet",
        entityId: row.id || String(row._id),
        before: null,
        after: row,
      });
      req.app.locals.io.emit("ui.updated");
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/preview", authRequired, async (req, res, next) => {
  try {
    const { html = "", css = "", js = "" } = req.query;
    const doc = `<!doctype html>
<html><head><style>${css}</style></head><body>${html}
<script>
try { ${js} } catch (e) { document.body.innerHTML += '<pre>' + e.message + '</pre>'; }
</script>
</body></html>`;
    res.json({ srcdoc: doc });
  } catch (error) {
    next(error);
  }
});

// GET /api/ui/features - Feature flags for frontend
router.get('/features', authRequired, async (req, res) => {
  try {
    // Default flags + overrides from UI state
    const uiState = await uiService.getUIState(req.app.locals.dbReady);
    const flags = {
      auth: true,
      adminLiveEdit: uiState?.adminLiveEditEnabled !== false,
      notifications: true,
      themeEngine: true,
      mobileNav: true,
      translateWidget: true,
      pwa: true,
      favorites: true
    };
    res.json(flags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

module.exports = router;
