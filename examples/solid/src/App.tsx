import { A11yHud } from "@a11y-hud/solid";
import { Route, Router } from "@solidjs/router";
import { createSignal } from "solid-js";
import PageA from "./pages/PageA.tsx";
import PageB from "./pages/PageB.tsx";

export default function App() {
  const [scopeEnabled, setScopeEnabled] = createSignal(false);
  const [scopeSection, setScopeSection] = createSignal<HTMLDivElement | null>(null);
  const [extraTabindex, setExtraTabindex] = createSignal(false);

  return (
    <>
      <A11yHud scope={scopeEnabled() ? scopeSection() : undefined} />

      <nav>
        <a href="/">Page A</a>
        <a href="/page-b">Page B</a>
      </nav>

      <div class="controls">
        <button
          id="btn-toggle-scope"
          type="button"
          onClick={() => setScopeEnabled(!scopeEnabled())}
        >
          {scopeEnabled() ? "Disable scope" : "Enable scope"}
        </button>
        <button id="btn-add-violation" type="button" onClick={() => setExtraTabindex(true)}>
          Add violation
        </button>
      </div>

      {extraTabindex() && (
        <button
          type="button"
          tabIndex={5}
          style="opacity: 0; position: absolute; pointer-events: none"
        >
          Positive tabindex
        </button>
      )}

      <input type="text" placeholder="Search (no label)" />

      <div ref={setScopeSection}>
        <Router>
          <Route path="/" component={PageA} />
          <Route path="/page-b" component={PageB} />
        </Router>
      </div>
    </>
  );
}
