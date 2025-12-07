import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.alert for tests
global.alert = vi.fn();
