/**
 * Safe storage utility for iOS compatibility
 * Handles cases where localStorage/sessionStorage might be blocked
 */

export const safeStorage = {
  getItem: (key: string, storage: 'local' | 'session' = 'local'): string | null => {
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      return storageObj.getItem(key);
    } catch (error) {
      console.warn(`Storage access blocked for ${storage}Storage.getItem(${key}):`, error);
      return null;
    }
  },

  setItem: (key: string, value: string, storage: 'local' | 'session' = 'local'): boolean => {
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      storageObj.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Storage access blocked for ${storage}Storage.setItem(${key}):`, error);
      return false;
    }
  },

  removeItem: (key: string, storage: 'local' | 'session' = 'local'): boolean => {
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      storageObj.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Storage access blocked for ${storage}Storage.removeItem(${key}):`, error);
      return false;
    }
  },

  clear: (storage: 'local' | 'session' = 'local'): boolean => {
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      storageObj.clear();
      return true;
    } catch (error) {
      console.warn(`Storage access blocked for ${storage}Storage.clear():`, error);
      return false;
    }
  },

  // Check if storage is available
  isAvailable: (storage: 'local' | 'session' = 'local'): boolean => {
    try {
      const storageObj = storage === 'local' ? localStorage : sessionStorage;
      const testKey = '__storage_test__';
      storageObj.setItem(testKey, 'test');
      storageObj.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Fallback in-memory storage for when localStorage/sessionStorage is not available
class InMemoryStorage {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// Create fallback storage instances
const fallbackLocalStorage = new InMemoryStorage();
const fallbackSessionStorage = new InMemoryStorage();

// Enhanced safe storage with fallback
export const safeStorageWithFallback = {
  getItem: (key: string, storage: 'local' | 'session' = 'local'): string | null => {
    if (safeStorage.isAvailable(storage)) {
      return safeStorage.getItem(key, storage);
    }
    
    const fallback = storage === 'local' ? fallbackLocalStorage : fallbackSessionStorage;
    return fallback.getItem(key);
  },

  setItem: (key: string, value: string, storage: 'local' | 'session' = 'local'): boolean => {
    if (safeStorage.isAvailable(storage)) {
      return safeStorage.setItem(key, value, storage);
    }
    
    const fallback = storage === 'local' ? fallbackLocalStorage : fallbackSessionStorage;
    fallback.setItem(key, value);
    return true;
  },

  removeItem: (key: string, storage: 'local' | 'session' = 'local'): boolean => {
    if (safeStorage.isAvailable(storage)) {
      return safeStorage.removeItem(key, storage);
    }
    
    const fallback = storage === 'local' ? fallbackLocalStorage : fallbackSessionStorage;
    fallback.removeItem(key);
    return true;
  },

  clear: (storage: 'local' | 'session' = 'local'): boolean => {
    if (safeStorage.isAvailable(storage)) {
      return safeStorage.clear(storage);
    }
    
    const fallback = storage === 'local' ? fallbackLocalStorage : fallbackSessionStorage;
    fallback.clear();
    return true;
  }
};
