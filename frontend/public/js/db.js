// Smart Hub IndexedDB Wrapper v1.0
const DB_NAME = 'SmartHubDB';
const DB_VERSION = 1;
let db = null;

const schemas = {
  history: '++id, timestamp, tool, inputs, results',
  favorites: '++id, link, name, category, timestamp'
};

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = e => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function migrateLocalStorage() {
  if (!db) await initDB();
  
  // Migrate history
  const localHistory = JSON.parse(localStorage.getItem('calc_history') || '[]');
  const tx = db.transaction('history', 'readwrite');
  const store = tx.objectStore('history');
  for (let item of localHistory) {
    await store.add({ ...item, timestamp: Date.now() });
  }
  localStorage.removeItem('calc_history');
  
  // Migrate favorites
  const localFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favStore = tx.objectStore('favorites');
  for (let item of localFavs) {
    await favStore.add({ link: item, timestamp: Date.now() });
  }
  localStorage.removeItem('favorites');
}

async function saveHistory(item) {
  if (!db) await initDB();
  const tx = db.transaction('history', 'readwrite');
  await tx.objectStore('history').add({ ...item, timestamp: Date.now() });
}

async function getHistory(limit = 50) {
  if (!db) await initDB();
  const tx = db.transaction('history', 'readonly');
  const store = tx.objectStore('history');
  const request = store.getAll(0, limit);
  return new Promise(resolve => {
    request.onsuccess = () => resolve(request.result.reverse());
  });
}

window.initSmartHubDB = async () => {
  await initDB();
  await migrateLocalStorage();
  console.log('Smart Hub DB ready');
};

// Export for script.js
window.DB = { saveHistory, getHistory, init: initSmartHubDB };

