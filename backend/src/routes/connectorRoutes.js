const express = require("express");
const { authRequired, allowRoles } = require("../middleware/auth");
const connectorService = require("../services/connectorService");
const { writeAudit } = require("../services/auditService");

const router = express.Router();

router.get("/", authRequired, allowRoles("admin"), async (req, res, next) => {
  try {
    const rows = await connectorService.listConnectors(req.app.locals.dbReady);
    res.json(rows.map(connectorService.sanitizeConnector));
  } catch (error) {
    next(error);
  }
});

router.post("/", authRequired, allowRoles("admin"), async (req, res, next) => {
  try {
    const row = await connectorService.createConnector(req.app.locals.dbReady, req.body);
    await writeAudit(req.app.locals.dbReady, {
      actor: req.user.username,
      role: req.user.role,
      action: "connector.create",
      entityType: "connector",
      entityId: row.id || String(row._id),
      before: null,
      after: connectorService.sanitizeConnector(row),
    });
    res.status(201).json(connectorService.sanitizeConnector(row));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", authRequired, allowRoles("admin"), async (req, res, next) => {
  try {
    const row = await connectorService.updateConnector(
      req.app.locals.dbReady,
      req.params.id,
      req.body
    );
    if (!row) return res.status(404).json({ error: "connector not found" });
    res.json(connectorService.sanitizeConnector(row));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authRequired, allowRoles("admin"), async (req, res, next) => {
  try {
    await connectorService.deleteConnector(req.app.locals.dbReady, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
