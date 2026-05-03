import { afterEach, describe, expect, it, vi } from "vitest";
import { runScan } from "./scan.js";

vi.mock("axe-core", () => ({
  default: {
    run: vi
      .fn()
      .mockResolvedValue({ violations: [], passes: [], incomplete: [], inapplicable: [] }),
  },
}));

describe("runScan", () => {
  afterEach(() => vi.clearAllMocks());

  it("calls axe.run with document.body when no target is given", async () => {
    const axe = (await import("axe-core")).default;
    await runScan();
    expect(axe.run).toHaveBeenCalledWith(document.body);
  });

  it("calls axe.run with the provided element", async () => {
    const axe = (await import("axe-core")).default;
    const el = document.createElement("main");
    await runScan(el);
    expect(axe.run).toHaveBeenCalledWith(el);
  });

  it("returns the axe result object", async () => {
    const result = await runScan();
    expect(result).toMatchObject({ violations: [] });
  });

  it("filters out violations whose nodes all originate from a11y-hud", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    axe.run.mockResolvedValueOnce({
      violations: [
        {
          id: "color-contrast",
          nodes: [{ target: ["a11y-hud .filter-chip"] }],
        },
        {
          id: "image-alt",
          nodes: [{ target: ["img"] }],
        },
        {
          id: "label",
          nodes: [{ target: ["a11y-hud .some-element"] }, { target: ["input"] }],
        },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    });

    const result = await runScan();
    // color-contrast is fully inside a11y-hud → removed entirely
    expect(result.violations.find((v) => v.id === "color-contrast")).toBeUndefined();
    // image-alt has no a11y-hud nodes → kept as-is
    expect(result.violations.find((v) => v.id === "image-alt")).toBeDefined();
    // label has one a11y-hud node and one real node → kept, but with only the real node
    const label = result.violations.find((v) => v.id === "label");
    expect(label?.nodes).toHaveLength(1);
    expect(label?.nodes[0]?.target[0]).toBe("input");
  });

  it("serializes concurrent calls — second waits for first to complete", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };

    const callOrder: number[] = [];
    let resolveFirst!: () => void;
    const emptyResult = { violations: [], passes: [], incomplete: [], inapplicable: [] };

    axe.run
      .mockImplementationOnce(
        () =>
          new Promise<AxeResults>((resolve) => {
            resolveFirst = () => resolve(emptyResult as AxeResults);
            callOrder.push(1);
          })
      )
      .mockImplementationOnce(() => {
        callOrder.push(2);
        return Promise.resolve(emptyResult as AxeResults);
      });

    const first = runScan();
    const second = runScan();

    expect(callOrder).toEqual([1]);

    resolveFirst();
    await first;
    await second;

    expect(callOrder).toEqual([1, 2]);
    expect(axe.run).toHaveBeenCalledTimes(2);
  });
});
