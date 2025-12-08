import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.alert for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).alert = vi.fn();
