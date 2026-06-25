const DB_NAME = 'TuzlucaOSDb';
const DB_VERSION = 1;
const STORE_NAME = 'keyvaluepairs';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
        e.target.result.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const idbStorage = {
  async getItem(key) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = async () => {
          if (request.result !== undefined) {
            resolve(request.result);
          } else {
            // Migrasyon (Migration) from localStorage
            const oldStr = localStorage.getItem(key);
            if (oldStr) {
              try {
                const parsed = JSON.parse(oldStr);
                await idbStorage.setItem(key, parsed);
                resolve(parsed);
              } catch(e) {
                // If it's not JSON, just save as string
                await idbStorage.setItem(key, oldStr);
                resolve(oldStr);
              }
            } else {
              resolve(null);
            }
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch(e) {
      // Fallback to localStorage on complete IndexedDB failure
      const oldStr = localStorage.getItem(key);
      if (oldStr) {
        try { return JSON.parse(oldStr); }
        catch(err) { return oldStr; }
      }
      return null;
    }
  },
  async setItem(key, value) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch(e) {
      // Fallback
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
      return false;
    }
  },
  async removeItem(key) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch(e) {
      localStorage.removeItem(key);
      return false;
    }
  }
};

export const enqueueOfflineAction = async (action) => {
  const queue = await idbStorage.getItem('offlineQueue') || [];
  queue.push({ ...action, timestamp: Date.now() });
  await idbStorage.setItem('offlineQueue', queue);
};

export const getOfflineQueue = async () => {
  return await idbStorage.getItem('offlineQueue') || [];
};

export const clearOfflineQueue = async () => {
  await idbStorage.setItem('offlineQueue', []);
};
