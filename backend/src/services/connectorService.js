const Connector = require("../models/Connector");
const { memoryStore, createId } = require("../store/memoryStore");
const { encrypt, decrypt } = require("../utils/crypto");

async function listConnectors(dbReady) {
  if (dbReady) return Connector.find().sort({ createdAt: -1 });
  return memoryStore.connectors.slice().reverse();
}

async function createConnector(dbReady, payload) {
  const connectorPayload = {
    name: payload.name,
    type: payload.type,
    environment: payload.environment || "dev",
    connectionStringEncrypted: encrypt(payload.connectionString),
    metadata: payload.metadata || {},
    isActive: Boolean(payload.isActive),
  };

  if (dbReady) {
    if (connectorPayload.isActive) {
      await Connector.updateMany(
        { environment: connectorPayload.environment },
        { $set: { isActive: false } }
      );
    }
    return Connector.create(connectorPayload);
  }

  if (connectorPayload.isActive) {
    memoryStore.connectors = memoryStore.connectors.map((item) =>
      item.environment === connectorPayload.environment
        ? { ...item, isActive: false }
        : item
    );
  }
  const connector = { id: createId(), ...connectorPayload, createdAt: new Date() };
  memoryStore.connectors.push(connector);
  return connector;
}

async function updateConnector(dbReady, id, payload) {
  if (dbReady) {
    const update = { ...payload };
    if (payload.connectionString) {
      update.connectionStringEncrypted = encrypt(payload.connectionString);
      delete update.connectionString;
    }
    if (payload.isActive && payload.environment) {
      await Connector.updateMany(
        { environment: payload.environment },
        { $set: { isActive: false } }
      );
    }
    return Connector.findByIdAndUpdate(id, update, { new: true });
  }
  const idx = memoryStore.connectors.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const update = { ...payload };
  if (payload.connectionString) {
    update.connectionStringEncrypted = encrypt(payload.connectionString);
    delete update.connectionString;
  }
  if (payload.isActive && payload.environment) {
    memoryStore.connectors = memoryStore.connectors.map((item) =>
      item.environment === payload.environment ? { ...item, isActive: false } : item
    );
  }
  memoryStore.connectors[idx] = {
    ...memoryStore.connectors[idx],
    ...update,
    updatedAt: new Date(),
  };
  return memoryStore.connectors[idx];
}

async function deleteConnector(dbReady, id) {
  if (dbReady) {
    await Connector.deleteOne({ _id: id });
    return true;
  }
  memoryStore.connectors = memoryStore.connectors.filter((c) => c.id !== id);
  return true;
}

function sanitizeConnector(record) {
  const plain = record.toObject ? record.toObject() : record;
  return {
    ...(plain.id ? { id: plain.id } : { id: String(plain._id) }),
    name: plain.name,
    type: plain.type,
    environment: plain.environment,
    metadata: plain.metadata || {},
    isActive: Boolean(plain.isActive),
    connectionStringMasked: maskSecret(decrypt(plain.connectionStringEncrypted)),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

module.exports = {
  listConnectors,
  createConnector,
  updateConnector,
  deleteConnector,
  sanitizeConnector,
};
