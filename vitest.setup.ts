import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && typeof globalThis.localStorage?.clear !== 'function') {
  let store: Record<string, string> = {};
  const localStorageMock: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key) => store[key] ?? null,
    key: (index) => Object.keys(store)[index] ?? null,
    removeItem: (key) => {
      delete store[key];
    },
    setItem: (key, value) => {
      store[key] = String(value);
    },
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });
}
