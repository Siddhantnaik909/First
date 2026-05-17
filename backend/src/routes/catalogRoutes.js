const express = require("express");
const { authRequired, allowRoles } = require("../middleware/auth");
const { buildCatalogTree } = require("../utils/tree");
const catalogService = require("../services/catalogService");
const { writeAudit } = require("../services/auditService");

const router = express.Router();

router.get("/tree", authRequired, async (req, res, next) => {
  try {
    const dbReady = req.app.locals.dbReady;
    const [categories, calculators] = await Promise.all([
      catalogService.getCategories(dbReady),
      catalogService.getCalculators(dbReady),
    ]);
    const tree = buildCatalogTree(categories, calculators, req.query.search || "");
    res.json({ tree });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/categories",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      const category = await catalogService.createCategory(dbReady, req.body);
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "category.create",
        entityType: "category",
        entityId: category.id || String(category._id),
        before: null,
        after: category,
      });
      req.app.locals.io.emit("catalog.updated");
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/categories/:id",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      const updated = await catalogService.updateCategory(
        dbReady,
        req.params.id,
        req.body
      );
      if (!updated) return res.status(404).json({ error: "category not found" });
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "category.update",
        entityType: "category",
        entityId: req.params.id,
        before: null,
        after: updated,
      });
      req.app.locals.io.emit("catalog.updated");
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/categories/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      await catalogService.deleteCategory(dbReady, req.params.id);
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "category.delete",
        entityType: "category",
        entityId: req.params.id,
        before: null,
        after: null,
      });
      req.app.locals.io.emit("catalog.updated");
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/categories/reorder",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      await catalogService.reorderCategories(dbReady, req.body.items || []);
      req.app.locals.io.emit("catalog.updated");
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/calculators",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      const calculator = await catalogService.createCalculator(dbReady, req.body);
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "calculator.create",
        entityType: "calculator",
        entityId: calculator.id || String(calculator._id),
        before: null,
        after: calculator,
      });
      req.app.locals.io.emit("catalog.updated");
      res.status(201).json(calculator);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/calculators/:id",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      const calculator = await catalogService.updateCalculator(
        dbReady,
        req.params.id,
        req.body
      );
      if (!calculator) return res.status(404).json({ error: "calculator not found" });
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "calculator.update",
        entityType: "calculator",
        entityId: req.params.id,
        before: null,
        after: calculator,
      });
      req.app.locals.io.emit("catalog.updated");
      res.json(calculator);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/calculators/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      await catalogService.deleteCalculator(dbReady, req.params.id);
      await writeAudit(dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "calculator.delete",
        entityType: "calculator",
        entityId: req.params.id,
        before: null,
        after: null,
      });
      req.app.locals.io.emit("catalog.updated");
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/calculators/reorder",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const dbReady = req.app.locals.dbReady;
      await catalogService.reorderCalculators(dbReady, req.body.items || []);
      req.app.locals.io.emit("catalog.updated");
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/calculators/:id/versions",
  authRequired,
  allowRoles("admin", "editor", "viewer"),
  async (req, res, next) => {
    try {
      const rows = await catalogService.listCalculatorVersions(
        req.app.locals.dbReady,
        req.params.id
      );
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/calculators/:id/versions",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const row = await catalogService.createCalculatorVersion(
        req.app.locals.dbReady,
        req.params.id,
        { ...req.body, changedBy: req.user.username }
      );
      if (!row) return res.status(404).json({ error: "calculator not found" });
      await writeAudit(req.app.locals.dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "calculator.version.create",
        entityType: "calculator",
        entityId: req.params.id,
        before: null,
        after: row,
      });
      req.app.locals.io.emit("catalog.updated");
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/calculators/:id/rollback/:versionId",
  authRequired,
  allowRoles("admin", "editor"),
  async (req, res, next) => {
    try {
      const row = await catalogService.rollbackCalculatorVersion(
        req.app.locals.dbReady,
        req.params.id,
        req.params.versionId
      );
      if (!row) return res.status(404).json({ error: "version or calculator not found" });
      await writeAudit(req.app.locals.dbReady, {
        actor: req.user.username,
        role: req.user.role,
        action: "calculator.version.rollback",
        entityType: "calculator",
        entityId: req.params.id,
        before: null,
        after: row,
      });
      req.app.locals.io.emit("catalog.updated");
      res.json(row);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
