import { type BoundFunctions, type queries, within } from "@testing-library/dom";

export type Scope = BoundFunctions<typeof queries>;

/**
 * Binds testing-library queries to a shadow root. The queries only need
 * `querySelectorAll` and the accessibility tree, both of which a ShadowRoot
 * provides, but the type signature of `within` asks for an HTMLElement.
 */
export function withinShadow(root: ShadowRoot): Scope {
  return within(root as unknown as HTMLElement);
}
