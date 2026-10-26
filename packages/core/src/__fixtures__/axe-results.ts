import type { AxeResults, NodeResult, Result } from "axe-core";

/**
 * Fixture builders for axe-core results.
 *
 * Every builder is typed against axe-core's own types so that an axe-core
 * upgrade that changes the result shape fails at compile time instead of
 * letting the integration tests pass against fiction.
 */

export function mockNode(overrides: Partial<NodeResult> = {}): NodeResult {
  return {
    html: '<img src="test.png">',
    impact: "critical",
    target: ["img"],
    any: [],
    all: [],
    none: [],
    failureSummary: "Fix any of the following",
    ...overrides,
  };
}

export function mockViolation(overrides: Partial<Result> = {}): Result {
  return {
    id: "image-alt",
    impact: "critical",
    tags: ["wcag2a"],
    description: "Images must have alternate text",
    help: "Image alt attribute",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
    nodes: [mockNode()],
    ...overrides,
  };
}

export function mockAxeResults(overrides: Partial<AxeResults> = {}): AxeResults {
  return {
    violations: [mockViolation()],
    passes: [],
    incomplete: [],
    inapplicable: [],
    timestamp: "2026-01-01T00:00:00.000Z",
    url: "http://localhost/",
    testEngine: { name: "axe-core", version: "4.0.0" },
    testEnvironment: {
      userAgent: "",
      windowWidth: 0,
      windowHeight: 0,
      orientationAngle: 0,
      orientationType: "",
    },
    testRunner: { name: "axe" },
    toolOptions: {},
    ...overrides,
  };
}
