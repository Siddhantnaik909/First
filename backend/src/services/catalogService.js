const Category = require("../models/Category");
const Calculator = require("../models/Calculator");
const CalculatorVersion = require("../models/CalculatorVersion");
const { memoryStore, createId } = require("../store/memoryStore");

async function getCategories(dbReady) {
  if (dbReady) return Category.find().lean();
  return memoryStore.categories;
}

async function getCalculators(dbReady) {
  if (dbReady) return Calculator.find().lean();
  return memoryStore.calculators;
}

async function createCategory(dbReady, payload) {
  if (dbReady) return Category.create(payload);
  const category = {
    id: createId(),
    name: payload.name,
    description: payload.description || "",
    parentId: payload.parentId || null,
    order: payload.order || 0,
    tags: payload.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.categories.push(category);
  return category;
}

async function updateCategory(dbReady, id, patch) {
  if (dbReady) return Category.findByIdAndUpdate(id, patch, { new: true });
  const idx = memoryStore.categories.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  memoryStore.categories[idx] = {
    ...memoryStore.categories[idx],
    ...patch,
    updatedAt: new Date(),
  };
  return memoryStore.categories[idx];
}

async function deleteCategory(dbReady, id) {
  if (dbReady) {
    await Category.deleteOne({ _id: id });
    await Category.updateMany({ parentId: id }, { $set: { parentId: null } });
    await Calculator.updateMany({ categoryId: id }, { $set: { categoryId: null } });
    return true;
  }
  memoryStore.categories = memoryStore.categories.filter((c) => c.id !== id);
  memoryStore.categories = memoryStore.categories.map((c) =>
    c.parentId === id ? { ...c, parentId: null } : c
  );
  memoryStore.calculators = memoryStore.calculators.map((calc) =>
    calc.categoryId === id ? { ...calc, categoryId: null } : calc
  );
  return true;
}

async function reorderCategories(dbReady, items) {
  if (dbReady) {
    await Promise.all(
      items.map((item) =>
        Category.updateOne(
          { _id: item.id },
          { $set: { parentId: item.parentId || null, order: item.order || 0 } }
        )
      )
    );
    return true;
  }
  const updates = new Map(items.map((x) => [x.id, x]));
  memoryStore.categories = memoryStore.categories.map((cat) => {
    const update = updates.get(cat.id);
    if (!update) return cat;
    return {
      ...cat,
      parentId: update.parentId || null,
      order: update.order || 0,
      updatedAt: new Date(),
    };
  });
  return true;
}

async function createCalculator(dbReady, payload) {
  if (dbReady) return Calculator.create(payload);
  const calculator = {
    id: createId(),
    name: payload.name,
    description: payload.description || "",
    tags: payload.tags || [],
    categoryId: payload.categoryId || null,
    order: payload.order || 0,
    logicJs: payload.logicJs || "",
    uiJson: payload.uiJson || {},
    currentVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.calculators.push(calculator);
  return calculator;
}

async function updateCalculator(dbReady, id, patch) {
  if (dbReady) return Calculator.findByIdAndUpdate(id, patch, { new: true });
  const idx = memoryStore.calculators.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  memoryStore.calculators[idx] = {
    ...memoryStore.calculators[idx],
    ...patch,
    updatedAt: new Date(),
  };
  return memoryStore.calculators[idx];
}

async function deleteCalculator(dbReady, id) {
  if (dbReady) {
    await Calculator.deleteOne({ _id: id });
    await CalculatorVersion.deleteMany({ calculatorId: id });
    return true;
  }
  memoryStore.calculators = memoryStore.calculators.filter((c) => c.id !== id);
  memoryStore.calculatorVersions = memoryStore.calculatorVersions.filter(
    (v) => v.calculatorId !== id
  );
  return true;
}

async function reorderCalculators(dbReady, items) {
  if (dbReady) {
    await Promise.all(
      items.map((item) =>
        Calculator.updateOne(
          { _id: item.id },
          { $set: { categoryId: item.categoryId || null, order: item.order || 0 } }
        )
      )
    );
    return true;
  }
  const updates = new Map(items.map((x) => [x.id, x]));
  memoryStore.calculators = memoryStore.calculators.map((calc) => {
    const update = updates.get(calc.id);
    if (!update) return calc;
    return {
      ...calc,
      categoryId: update.categoryId || null,
      order: update.order || 0,
      updatedAt: new Date(),
    };
  });
  return true;
}

async function createCalculatorVersion(dbReady, calculatorId, payload) {
  if (dbReady) {
    const calc = await Calculator.findById(calculatorId);
    if (!calc) return null;
    const version = (calc.currentVersion || 1) + 1;
    const entry = await CalculatorVersion.create({
      calculatorId,
      version,
      logicJs: payload.logicJs ?? calc.logicJs,
      uiJson: payload.uiJson ?? calc.uiJson,
      notes: payload.notes || "",
      changedBy: payload.changedBy || "system",
    });
    calc.logicJs = entry.logicJs;
    calc.uiJson = entry.uiJson;
    calc.currentVersion = version;
    await calc.save();
    return entry;
  }
  const idx = memoryStore.calculators.findIndex((c) => c.id === calculatorId);
  if (idx < 0) return null;
  const calc = memoryStore.calculators[idx];
  const version = (calc.currentVersion || 1) + 1;
  const entry = {
    id: createId(),
    calculatorId,
    version,
    logicJs: payload.logicJs ?? calc.logicJs,
    uiJson: payload.uiJson ?? calc.uiJson,
    notes: payload.notes || "",
    changedBy: payload.changedBy || "system",
    createdAt: new Date(),
  };
  memoryStore.calculatorVersions.push(entry);
  memoryStore.calculators[idx] = {
    ...calc,
    logicJs: entry.logicJs,
    uiJson: entry.uiJson,
    currentVersion: version,
    updatedAt: new Date(),
  };
  return entry;
}

async function listCalculatorVersions(dbReady, calculatorId) {
  if (dbReady) {
    return CalculatorVersion.find({ calculatorId }).sort({ version: -1 });
  }
  return memoryStore.calculatorVersions
    .filter((v) => v.calculatorId === calculatorId)
    .sort((a, b) => b.version - a.version);
}

async function rollbackCalculatorVersion(dbReady, calculatorId, versionId) {
  if (dbReady) {
    const version = await CalculatorVersion.findById(versionId);
    if (!version) return null;
    const calc = await Calculator.findById(calculatorId);
    if (!calc) return null;
    calc.logicJs = version.logicJs;
    calc.uiJson = version.uiJson;
    calc.currentVersion = version.version;
    await calc.save();
    return calc;
  }
  const version = memoryStore.calculatorVersions.find((v) => v.id === versionId);
  if (!version) return null;
  const idx = memoryStore.calculators.findIndex((c) => c.id === calculatorId);
  if (idx < 0) return null;
  memoryStore.calculators[idx] = {
    ...memoryStore.calculators[idx],
    logicJs: version.logicJs,
    uiJson: version.uiJson,
    currentVersion: version.version,
    updatedAt: new Date(),
  };
  return memoryStore.calculators[idx];
}

module.exports = {
  getCategories,
  getCalculators,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createCalculator,
  updateCalculator,
  deleteCalculator,
  reorderCalculators,
  createCalculatorVersion,
  listCalculatorVersions,
  rollbackCalculatorVersion,
};
