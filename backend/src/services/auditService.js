const AuditLog = require("../models/AuditLog");
const { memoryStore, createId } = require("../store/memoryStore");

async function writeAudit(dbReady, payload) {
  if (dbReady) {
    return AuditLog.create(payload);
  }
  const record = { id: createId(), ...payload, createdAt: new Date() };
  memoryStore.auditLogs.unshift(record);
  return record;
}

async function listAudits(dbReady, limit = 100, page = 0) {
  if (dbReady) {
    return AuditLog.find().sort({ createdAt: -1 }).skip(page * limit).limit(limit);
  }
  const start = page * limit;
  return memoryStore.auditLogs.slice(start, start + limit);
}

async function getAudit(dbReady, id) {
  if (dbReady) {
    return AuditLog.findById(id);
  }
  return memoryStore.auditLogs.find(log => log.id === id || log._id === id);
}

async function deleteAudit(dbReady, id) {
  if (dbReady) {
    return AuditLog.findByIdAndDelete(id);
  }
  const index = memoryStore.auditLogs.findIndex(log => log.id === id || log._id === id);
  if (index > -1) {
    memoryStore.auditLogs.splice(index, 1);
    return { deletedCount: 1 };
  }
  return { deletedCount: 0 };
}

async function searchAudits(dbReady, filters = {}) {
  const { actor, action, entityType, dateFrom, dateTo, page = 0, limit = 50 } = filters;
  if (dbReady) {
    let query = {};
    if (actor) query.actor = { $regex: actor, $options: 'i' };
    if (action) query.action = { $regex: action, $options: 'i' };
    if (entityType) query.entityType = { $regex: entityType, $options: 'i' };
    if (dateFrom) query.createdAt = { ...query.createdAt, $gte: new Date(dateFrom) };
    if (dateTo) query.createdAt = { ...query.createdAt, $lte: new Date(dateTo + 'T23:59:59.999Z') };
    return AuditLog.find(query).sort({ createdAt: -1 }).skip(page * limit).limit(limit);
  }
  let results = memoryStore.auditLogs;
  if (actor) results = results.filter(log => log.actor.toLowerCase().includes(actor.toLowerCase()));
  if (action) results = results.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
  if (entityType) results = results.filter(log => log.entityType.toLowerCase().includes(entityType.toLowerCase()));
  if (dateFrom) results = results.filter(log => new Date(log.createdAt) >= new Date(dateFrom));
  if (dateTo) results = results.filter(log => new Date(log.createdAt) <= new Date(dateTo + 'T23:59:59.999Z'));
  const start = page * limit;
  return results.slice(start, start + limit);
}

module.exports = { writeAudit, listAudits, getAudit, deleteAudit, searchAudits };
