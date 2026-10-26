import type { AxeResults } from "axe-core";
import { type Mock, vi } from "vitest";

/**
 * Module mock for `axe-core`, the only boundary the core integration tests
 * replace. Register it at the top of a test file with:
 *
 *   vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));
 *
 * and import `axeRun` to control what a scan returns.
 */
export const axeRun: Mock<(context: unknown, options: unknown) => Promise<AxeResults>> = vi.fn();

const axeCoreMock: { run: typeof axeRun } = { run: axeRun };

export default axeCoreMock;
