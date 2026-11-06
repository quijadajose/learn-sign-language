// En ESM Jest no inyecta el global `jest`: lo exponemos desde @jest/globals
// para que los specs sigan usando `jest.fn()`, `jest.spyOn()`, etc. sin import.
import { jest } from '@jest/globals';

(globalThis as unknown as { jest: typeof jest }).jest = jest;
