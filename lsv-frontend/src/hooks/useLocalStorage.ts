import { useState, useEffect, useCallback, useRef } from "react";

function valuesEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;

      try {
        return JSON.parse(item);
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  // Último valor conocido. Permite calcular el siguiente valor fuera del
  // updater de React, donde no deben ocurrir efectos secundarios.
  const latestRef = useRef<T>(storedValue);

  const commit = useCallback((next: T) => {
    latestRef.current = next;
    setStoredValue(next);
  }, []);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === "undefined") {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`,
        );
      }

      try {
        const prev = latestRef.current;
        const newValue = value instanceof Function ? value(prev) : value;
        if (!valuesEqual(prev, newValue)) {
          if (newValue === null || newValue === undefined) {
            window.localStorage.removeItem(key);
          } else if (typeof newValue === "string") {
            window.localStorage.setItem(key, newValue);
          } else {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          }
          commit(newValue);
        }

        window.dispatchEvent(new Event("local-storage"));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, commit],
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const next = readValue();
      if (!valuesEqual(latestRef.current, next)) {
        commit(next);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, [readValue, commit]);

  return [storedValue, setValue] as const;
}
