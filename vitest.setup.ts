import "@testing-library/jest-dom/vitest";

// Provide a minimal localStorage for jsdom when the runtime doesn't supply one
// (some Node/jsdom combinations leave window.localStorage undefined).
if (typeof window !== "undefined" && !window.localStorage) {
  class MemoryStorage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
  }
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}
