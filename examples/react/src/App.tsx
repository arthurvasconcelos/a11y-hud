import { A11yHud } from "@a11y-hud/react";
import { useRef, useState } from "react";
import { Link, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import { PageA } from "./pages/PageA.js";
import { PageB } from "./pages/PageB.js";

function AppContent() {
  // Subscribes to route changes so this component re-renders on navigation,
  // which fires the render-settled rescan inside useA11yHud.
  const _location = useLocation();
  const [scopeEnabled, setScopeEnabled] = useState(false);
  const [extraTabindex, setExtraTabindex] = useState(false);
  const scopeSectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <A11yHud scope={scopeEnabled ? scopeSectionRef : undefined} />

      <nav>
        <Link to="/">Page A</Link>
        <Link to="/page-b">Page B</Link>
      </nav>

      <div className="controls">
        <button type="button" id="btn-toggle-scope" onClick={() => setScopeEnabled((s) => !s)}>
          {scopeEnabled ? "Disable scope" : "Enable scope"}
        </button>
        <button type="button" id="btn-add-violation" onClick={() => setExtraTabindex(true)}>
          Add violation
        </button>
      </div>

      {extraTabindex && (
        <button
          type="button"
          tabIndex={5}
          style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
        >
          Positive tabindex
        </button>
      )}

      {/* This unlabelled input is outside the scope section.
          It creates a `label` violation that disappears when scope is enabled. */}
      <input type="text" placeholder="Search (no label)" />

      <div ref={scopeSectionRef}>
        <Routes>
          <Route path="/" element={<PageA />} />
          <Route path="/page-b" element={<PageB />} />
        </Routes>
      </div>
    </>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
