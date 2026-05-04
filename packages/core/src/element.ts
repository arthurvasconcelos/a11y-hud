import type { AxeResults, Result } from "axe-core";
import { icon } from "./icons/index.js";
import {
  addIgnore,
  clearIgnores,
  exportIgnores,
  importIgnores,
  listIgnores,
  removeIgnore,
} from "./ignores.js";
import {
  detectKeyboardViolations,
  type FocusableElementInfo,
  getFocusableElements,
  injectFocusOrderOverlay,
  type KeyboardViolation,
} from "./keyboard.js";
import { debounce } from "./observer.js";
import { runScan } from "./scan.js";
import baseCss from "./styles/base.css";
import themesCss from "./styles/themes.css";
import { resolveTheme, watchTheme } from "./theme.js";
import type { A11yHudExport, IgnoreEntry, Severity, Theme } from "./types.js";

const HIGHLIGHT_ATTR = "data-a11y-hud-highlighted";
const HIGHLIGHT_STYLE_ID = "a11y-hud-highlight-style";
const HIGHLIGHT_CSS = `[${HIGHLIGHT_ATTR}]{outline:3px solid #7c3aed!important;outline-offset:3px!important;scroll-margin:8px!important;}`;

const WCAG_LEVEL_TAGS: Record<string, string[]> = {
  A: ["wcag2a", "wcag21a"],
  AA: ["wcag2aa", "wcag21aa", "wcag22aa"],
  AAA: ["wcag2aaa"],
};

const SEVERITY_ICON: Record<Severity, string> = {
  critical: "alert-triangle",
  serious: "alert-circle",
  moderate: "alert-circle",
  minor: "info",
};

function isSeverity(value: string | null): value is Severity {
  return value === "critical" || value === "serious" || value === "moderate" || value === "minor";
}

function getViolationLevel(tags: string[]): string {
  for (const [level, levelTags] of Object.entries(WCAG_LEVEL_TAGS)) {
    if (tags.some((t) => levelTags.includes(t))) return level;
  }
  return "";
}

function findElement(target: Array<string | string[]>): Element | null {
  try {
    const last = target[target.length - 1];
    const selector = Array.isArray(last) ? last[last.length - 1] : last;
    return selector ? document.querySelector(selector) : null;
  } catch {
    return null;
  }
}

function ensureHighlightStyle(doc: Document): void {
  if (doc.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = HIGHLIGHT_CSS;
  doc.head.appendChild(style);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildStyleSheet(css: string): CSSStyleSheet | null {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
  } catch {
    return null;
  }
}

export class A11yHudElement extends HTMLElement {
  static observedAttributes = ["theme", "scope", "auto-scan", "debounce", "run-only"];

  private _shadow: ShadowRoot;
  private _theme: Theme = "auto";
  private _scopeSelector: string | undefined;
  private _scopeElement: Element | undefined;
  private _autoScan = true;
  private _debounceMs = 500;
  private _results: AxeResults | undefined;
  private _scanning = false;
  private _mounted = false;
  private _observer: MutationObserver | undefined;
  private _unwatchTheme: (() => void) | undefined;
  private _removeHighlight: (() => void) | undefined;
  private _activeSeverities = new Set<Severity>();
  private _activeLevels = new Set<string>();
  private _runOnly: string[] = [];
  private _debouncedScan: ((...args: never[]) => void) & { cancel(): void };
  private _keyboardMode = false;
  private _keyboardCleanup: (() => void) | undefined;
  private _kbElements: FocusableElementInfo[] = [];
  private _filtersOpen = false;
  private _ignoredSectionOpen = false;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._debouncedScan = debounce(() => void this._runScan(), this._debounceMs);
    this._applyStyles();
  }

  private _applyStyles(): void {
    const combined = `${baseCss}\n${themesCss}`;
    const sheet = buildStyleSheet(combined);
    if (sheet) {
      this._shadow.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement("style");
      style.textContent = combined;
      this._shadow.appendChild(style);
    }
  }

  connectedCallback(): void {
    this._mounted = true;
    this._applyResolvedTheme();
    this._render();
    this._unwatchTheme = watchTheme(
      () => this._theme,
      (resolved) => {
        this.dataset.theme = resolved;
      }
    );
    if (this._autoScan) this._startObserver();
    void this._runScan();
  }

  disconnectedCallback(): void {
    this._mounted = false;
    this._observer?.disconnect();
    this._unwatchTheme?.();
    this._removeHighlight?.();
    this._removeHighlight = undefined;
    this._keyboardCleanup?.();
    this._keyboardCleanup = undefined;
    this._debouncedScan.cancel();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    switch (name) {
      case "theme":
        this._theme = (value as Theme | null) ?? "auto";
        if (this._mounted) this._applyResolvedTheme();
        break;
      case "scope":
        this._scopeSelector = value ?? undefined;
        this._scopeElement = undefined;
        break;
      case "auto-scan":
        this._autoScan = value !== null;
        if (this._mounted) {
          if (this._autoScan) {
            this._startObserver();
          } else {
            this._observer?.disconnect();
            this._observer = undefined;
          }
        }
        break;
      case "debounce": {
        const parsed = Number.parseInt(value ?? "", 10);
        this._debounceMs = Number.isNaN(parsed) ? 500 : parsed;
        this._debouncedScan.cancel();
        this._debouncedScan = debounce(() => void this._runScan(), this._debounceMs);
        break;
      }
      case "run-only": {
        try {
          const parsed = value ? (JSON.parse(value) as unknown) : [];
          this._runOnly = Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          this._runOnly = [];
        }
        if (this._mounted) this._updateRunOnlyChips();
        break;
      }
    }
  }

  get scopeElement(): Element | undefined {
    return this._scopeElement;
  }

  set scopeElement(el: Element | undefined) {
    this._scopeElement = el;
    this._scopeSelector = undefined;
  }

  setTheme(theme: Theme): void {
    this._theme = theme;
    this.setAttribute("theme", theme);
    this._applyResolvedTheme();
  }

  setRunOnly(tags: string[]): void {
    this._runOnly = tags;
    if (tags.length > 0) {
      this.setAttribute("run-only", JSON.stringify(tags));
    } else {
      this.removeAttribute("run-only");
    }
    this._updateRunOnlyChips();
  }

  async runScan(): Promise<AxeResults> {
    return this._runScan();
  }

  private _getScopeTarget(): Element {
    if (this._scopeElement) return this._scopeElement;
    if (this._scopeSelector) {
      return document.querySelector(this._scopeSelector) ?? document.body;
    }
    return document.body;
  }

  private _applyResolvedTheme(): void {
    this.dataset.theme = resolveTheme(this._theme);
  }

  private _startObserver(): void {
    this._observer?.disconnect();
    const target = this._getScopeTarget();
    const debouncedScan = this._debouncedScan;

    this._observer = new MutationObserver((records) => {
      // Ignore mutations we caused ourselves (adding/removing the highlight
      // attribute on the host page). Without this guard, clicking a highlight
      // button triggers a rescan which rebuilds the list and collapses open items.
      if (records.every((r) => r.type === "attributes" && r.attributeName === HIGHLIGHT_ATTR))
        return;
      debouncedScan();
    });

    this._observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: false,
    });
  }

  private async _runScan(): Promise<AxeResults> {
    if (this._scanning) return this._results ?? ({ violations: [] } as unknown as AxeResults);
    this._scanning = true;

    const rescanBtn = this._shadow.querySelector<HTMLButtonElement>("#btn-rescan");
    if (rescanBtn) {
      rescanBtn.setAttribute("data-scanning", "");
      rescanBtn.disabled = true;
    }

    // Only show the full-body spinner on the very first scan — on rescan, keep
    // existing results visible and let the button spin instead.
    if (!this._results) this._renderScanning();

    // Yield to the browser's rendering pipeline so the spinning button state
    // is painted before the scan starts. Without this, axe.run resolves as a
    // microtask and the DOM change is never painted.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      const target = this._getScopeTarget();
      const results = await runScan(target, this._runOnly.length > 0 ? this._runOnly : undefined);
      if (!this._mounted) return results;
      this._results = results;
      this._render();
      return results;
    } finally {
      this._scanning = false;
      const btn = this._shadow.querySelector<HTMLButtonElement>("#btn-rescan");
      if (btn) {
        btn.removeAttribute("data-scanning");
        btn.disabled = false;
      }
    }
  }

  private _getFilteredViolations(): Result[] {
    const violations = this._results?.violations ?? [];
    return violations.filter((v) => {
      const impact = v.impact as Severity | null;
      if (this._activeSeverities.size > 0 && impact && !this._activeSeverities.has(impact))
        return false;
      const level = getViolationLevel(v.tags);
      if (this._activeLevels.size > 0 && level && !this._activeLevels.has(level)) return false;
      return true;
    });
  }

  private _render(): void {
    const filtered = this._getFilteredViolations();
    const total = this._results?.violations.length ?? 0;
    const panel = this._shadow.querySelector(".panel");

    if (!panel) {
      const template = document.createElement("template");
      template.innerHTML = this._renderPanel(filtered, total);
      this._shadow.appendChild(template.content);
      this._bindEvents();
      return;
    }

    const countEl = panel.querySelector(".panel-count");
    if (countEl) {
      countEl.textContent = String(total);
      countEl.setAttribute("data-count", String(total));
    }

    const fabCountEl = this._shadow.querySelector(".fab-count");
    if (fabCountEl) {
      fabCountEl.textContent = String(total);
      fabCountEl.setAttribute("data-count", String(total));
    }

    if (!this._keyboardMode) {
      const body = panel.querySelector(".panel-body");
      if (body) body.innerHTML = this._renderBody(filtered);
      this._bindHighlightEvents();
    }
  }

  private _renderScanning(): void {
    if (this._keyboardMode) return;
    const body = this._shadow.querySelector(".panel-body");
    if (body) {
      body.innerHTML = `
        <div class="scanning-state" aria-live="polite" aria-label="Scanning for accessibility issues">
          <span class="scanning-spinner" aria-hidden="true">${icon("refresh-cw")}</span>
          Scanning…
        </div>
        ${this._renderIgnoredSection()}
      `;
    }
  }

  private _renderPanel(violations: Result[], total: number): string {
    return `
      <div class="panel" role="complementary" aria-label="Accessibility panel">
        <div class="panel-header">
          <button class="btn-panel-title" aria-expanded="${this._filtersOpen}" aria-controls="panel-filters" aria-label="Toggle filters" title="Toggle filters">
            <span class="panel-title-icon" aria-hidden="true">${icon("filter")}</span>
            a11y
            <span class="panel-count" data-count="${total}" aria-live="polite" aria-label="${total} violations">${total}</span>
            <span class="panel-title-chevron" aria-hidden="true">${icon("chevron-down")}</span>
          </button>
          <div class="panel-actions" role="toolbar" aria-label="Panel actions">
            <button class="btn-icon" id="btn-copy-all" aria-label="Copy all violations to clipboard" title="Copy all">
              ${icon("copy")}
            </button>
            <button class="btn-icon" id="btn-export" aria-label="Export results as JSON" title="Export JSON">
              ${icon("download")}
            </button>
            <button class="btn-icon" id="btn-rescan" aria-label="Re-scan page" title="Re-scan">
              ${icon("refresh-cw")}
            </button>
            <button class="btn-icon" id="btn-keyboard" aria-label="Toggle keyboard mode" title="Keyboard mode" aria-pressed="false">
              ${icon("keyboard")}
            </button>
            <button class="btn-icon" id="btn-minimize" aria-label="Minimize panel" title="Minimize">
              ${icon("minus")}
            </button>
          </div>
        </div>
        ${this._renderFilters()}
        <div class="panel-body" role="region" aria-label="Violations">
          ${this._renderBody(violations)}
        </div>
      </div>
      <button class="fab" aria-label="Open accessibility panel" title="Open a11y panel">
        <span class="fab-icon" aria-hidden="true">${icon("filter")}</span>
        a11y
        <span class="fab-count" data-count="${total}">${total}</span>
      </button>
    `;
  }

  private _renderFilters(): string {
    const severities: Severity[] = ["critical", "serious", "moderate", "minor"];
    const levels = ["A", "AA", "AAA"];
    const ruleSets = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

    const severityChips = severities
      .map((s) => {
        const active = this._activeSeverities.has(s);
        const label = s.charAt(0).toUpperCase() + s.slice(1);
        return `<button class="filter-chip" data-severity="${s}" aria-pressed="${active}">${label}</button>`;
      })
      .join("");

    const levelChips = levels
      .map((l) => {
        const active = this._activeLevels.has(l);
        return `<button class="filter-chip" data-level="${l}" aria-pressed="${active}">${l}</button>`;
      })
      .join("");

    const ruleSetChips = ruleSets
      .map((r) => {
        const active = this._runOnly.includes(r);
        return `<button class="filter-chip" data-ruleset="${r}" aria-pressed="${active}">${r}</button>`;
      })
      .join("");

    return `
      <div id="panel-filters" class="panel-filters" aria-label="Filters" ${this._filtersOpen ? "data-open" : ""}>
        <div class="filter-group" role="group" aria-label="Filter by severity">${severityChips}</div>
        <div class="filter-group" role="group" aria-label="Filter by WCAG level">${levelChips}</div>
        <div class="filter-group" role="group" aria-label="Run only rule sets">${ruleSetChips}</div>
      </div>
    `;
  }

  private _renderBody(violations: Result[]): string {
    if (!this._results) {
      return `
        <div class="empty-state">
          <span class="scanning-spinner" aria-hidden="true">${icon("refresh-cw")}</span>
          <span class="empty-state-body">Running first scan…</span>
        </div>
        ${this._renderIgnoredSection()}
      `;
    }

    if (violations.length === 0) {
      return `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">${icon("check-circle")}</span>
          <span class="empty-state-title">No violations found</span>
          <span class="empty-state-body">
            ${this._results.violations.length > 0 ? "All violations filtered out." : "Great job! The scanned area has no axe-core violations."}
          </span>
        </div>
        ${this._renderIgnoredSection()}
      `;
    }

    const items = violations.map((v, i) => this._renderViolationItem(v, i)).join("");
    return `<ul class="violation-list" role="list" aria-label="${violations.length} violation${violations.length !== 1 ? "s" : ""}">${items}</ul>${this._renderIgnoredSection()}`;
  }

  private _renderIgnoredSection(): string {
    const entries = listIgnores();
    const removeAttrs = (e: IgnoreEntry) =>
      e.selector !== undefined
        ? `data-remove-rule="${e.ruleId}" data-remove-selector="${e.selector}"`
        : `data-remove-rule="${e.ruleId}"`;
    const listHtml =
      entries.length === 0
        ? `<p class="ignored-empty">No rules ignored yet.</p>`
        : `<ul class="ignored-list" aria-label="Ignored rules">${entries
            .map(
              (e) => `
              <li class="ignored-entry">
                <span class="ignored-rule-id">${e.ruleId}</span>
                ${e.selector !== undefined ? `<code class="ignored-selector">${e.selector}</code>` : ""}
                <button class="btn-remove-ignore" ${removeAttrs(e)} aria-label="Remove ignore for ${e.ruleId}">
                  ${icon("trash-2")}
                </button>
              </li>`
            )
            .join("")}</ul>`;
    return `
      <div class="ignored-section">
        <button class="ignored-section-toggle" aria-expanded="${this._ignoredSectionOpen}" aria-controls="ignored-section-body">
          <span>Ignored rules (${entries.length})</span>
          <span class="chevron-icon" aria-hidden="true">${icon("chevron-down")}</span>
        </button>
        <div id="ignored-section-body" class="ignored-section-body" ${this._ignoredSectionOpen ? "data-open" : ""}>
          ${listHtml}
          <div class="ignored-actions">
            <button class="btn-export-ignores btn-sm" aria-label="Export ignored rules as JSON" title="Export ignores">
              ${icon("download")} Export
            </button>
            <button class="btn-import-ignores btn-sm" aria-label="Import ignored rules from JSON" title="Import ignores">
              ${icon("upload")} Import
            </button>
            ${entries.length > 0 ? `<button class="btn-clear-ignores btn-sm" aria-label="Clear all ignored rules" title="Clear all">${icon("trash-2")} Clear all</button>` : ""}
          </div>
        </div>
      </div>`;
  }

  private _renderViolationItem(violation: Result, index: number): string {
    const impact = (violation.impact ?? "minor") as Severity;
    const iconName = SEVERITY_ICON[impact];
    const nodeCount = violation.nodes.length;
    const nodeLabel = `${nodeCount} node${nodeCount !== 1 ? "s" : ""}`;

    const nodes = violation.nodes
      .map((node, ni) => {
        const selector = this._nodeSelector(node.target);
        return `
          <li class="violation-node-item">
            <button class="btn-highlight" data-violation="${index}" data-node="${ni}" aria-label="Highlight: ${selector}">
              ${selector}
            </button>
          </li>
        `;
      })
      .join("");

    return `
      <li class="violation-item">
        <button class="violation-toggle" aria-expanded="false" aria-controls="violation-detail-${index}">
          <span class="severity-icon" data-severity="${impact}" aria-hidden="true">${icon(iconName)}</span>
          <span class="violation-rule">${violation.id}</span>
          <span class="violation-node-count" aria-label="${nodeLabel}">${nodeLabel}</span>
          <span class="chevron-icon" aria-hidden="true">${icon("chevron-down")}</span>
        </button>
        <div class="violation-detail" id="violation-detail-${index}" role="region" aria-label="${violation.id} details">
          <p class="violation-description">${violation.description}</p>
          <ul class="violation-nodes-list" aria-label="Affected elements">${nodes}</ul>
          <div class="violation-footer">
            <a class="violation-help-link" href="${violation.helpUrl}" target="_blank" rel="noopener noreferrer" aria-label="Learn more about ${violation.id}, opens in new tab">
              Learn more ↗
            </a>
            <button class="btn-copy-single" data-copy-violation="${index}" aria-label="Copy ${violation.id} to clipboard" title="Copy violation">
              ${icon("copy")} Copy
            </button>
            <button class="btn-ignore-rule" data-ignore-rule="${violation.id}" aria-label="Ignore rule ${violation.id}" title="Ignore this rule">
              ${icon("trash-2")} Ignore
            </button>
          </div>
        </div>
      </li>
    `;
  }

  private _nodeSelector(target: Array<string | string[]>): string {
    const last = target[target.length - 1];
    return (Array.isArray(last) ? last[last.length - 1] : last) ?? "";
  }

  private _bindEvents(): void {
    const panel = this._shadow.querySelector(".panel");
    if (!panel) return;

    panel.querySelector(".btn-panel-title")?.addEventListener("click", () => this._toggleFilters());
    panel.querySelector("#btn-rescan")?.addEventListener("click", () => void this._runScan());
    panel.querySelector("#btn-minimize")?.addEventListener("click", () => {
      this.setAttribute("data-minimized", "");
    });
    panel.querySelector("#btn-copy-all")?.addEventListener("click", () => void this._copyAll());
    panel.querySelector("#btn-export")?.addEventListener("click", () => this._exportJson());
    panel
      .querySelector("#btn-keyboard")
      ?.addEventListener("click", () => this._toggleKeyboardMode());

    panel.addEventListener("click", (e) => this._handlePanelClick(e));
    panel.addEventListener("keydown", (e) => this._handlePanelKeydown(e as KeyboardEvent));

    this._shadow.querySelector(".fab")?.addEventListener("click", () => {
      this.removeAttribute("data-minimized");
    });

    this._bindHighlightEvents();
  }

  private _bindHighlightEvents(): void {
    for (const btn of this._shadow.querySelectorAll(".btn-highlight")) {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const vIdx = Number.parseInt(target.dataset.violation ?? "", 10);
        const nIdx = Number.parseInt(target.dataset.node ?? "", 10);
        this._highlightNode(vIdx, nIdx);
      });
    }
  }

  private _handlePanelClick(e: Event): void {
    const target = e.target as HTMLElement;

    const toggle = target.closest(".violation-toggle") as HTMLElement | null;
    if (toggle) {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      const detailId = toggle.getAttribute("aria-controls");
      const detail = detailId ? this._shadow.getElementById(detailId) : null;
      if (detail) {
        if (expanded) {
          detail.removeAttribute("data-open");
        } else {
          detail.setAttribute("data-open", "");
        }
      }
      return;
    }

    const copyBtn = target.closest(".btn-copy-single") as HTMLElement | null;
    if (copyBtn) {
      const vIdx = Number.parseInt(copyBtn.dataset.copyViolation ?? "", 10);
      void this._copySingle(vIdx);
      return;
    }

    const kbdElementBtn = target.closest(".btn-kbd-element") as HTMLElement | null;
    if (kbdElementBtn) {
      const idx = Number.parseInt(kbdElementBtn.dataset.kbdElement ?? "", 10);
      const info = this._kbElements.find((e) => e.index === idx);
      if (info) {
        this._removeHighlight?.();
        ensureHighlightStyle(document);
        const el = info.element as HTMLElement;
        el.setAttribute(HIGHLIGHT_ATTR, "");
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        this._removeHighlight = () => el.removeAttribute(HIGHLIGHT_ATTR);
      }
      return;
    }

    const ignoreBtn = target.closest(".btn-ignore-rule") as HTMLElement | null;
    if (ignoreBtn) {
      const ruleId = ignoreBtn.dataset.ignoreRule;
      if (ruleId) {
        addIgnore(ruleId);
        void this._runScan();
      }
      return;
    }

    const removeIgnoreBtn = target.closest(".btn-remove-ignore") as HTMLElement | null;
    if (removeIgnoreBtn) {
      const ruleId = removeIgnoreBtn.dataset.removeRule;
      const selector = removeIgnoreBtn.dataset.removeSelector || undefined;
      if (ruleId) {
        removeIgnore(ruleId, selector);
        void this._runScan();
      }
      return;
    }

    if (target.closest(".btn-export-ignores")) {
      this._exportIgnoresJson();
      return;
    }

    if (target.closest(".btn-import-ignores")) {
      this._importIgnoresJson();
      return;
    }

    if (target.closest(".btn-clear-ignores")) {
      clearIgnores();
      void this._runScan();
      return;
    }

    const ignoredToggle = target.closest(".ignored-section-toggle") as HTMLElement | null;
    if (ignoredToggle) {
      this._ignoredSectionOpen = !this._ignoredSectionOpen;
      ignoredToggle.setAttribute("aria-expanded", String(this._ignoredSectionOpen));
      const bodyId = ignoredToggle.getAttribute("aria-controls");
      const sectionBody = bodyId ? this._shadow.getElementById(bodyId) : null;
      if (sectionBody) {
        sectionBody.toggleAttribute("data-open", this._ignoredSectionOpen);
      }
      return;
    }

    const chip = target.closest(".filter-chip") as HTMLElement | null;
    if (chip) {
      const severity = chip.dataset.severity;
      const level = chip.dataset.level;
      if (severity && isSeverity(severity)) {
        const active = this._activeSeverities.has(severity);
        if (active) {
          this._activeSeverities.delete(severity);
        } else {
          this._activeSeverities.add(severity);
        }
        chip.setAttribute("aria-pressed", String(!active));
        this._refreshBody();
      } else if (level) {
        const active = this._activeLevels.has(level);
        if (active) {
          this._activeLevels.delete(level);
        } else {
          this._activeLevels.add(level);
        }
        chip.setAttribute("aria-pressed", String(!active));
        this._refreshBody();
      } else if (chip.dataset.ruleset) {
        const ruleset = chip.dataset.ruleset;
        const active = this._runOnly.includes(ruleset);
        if (active) {
          this._runOnly = this._runOnly.filter((r) => r !== ruleset);
          chip.setAttribute("aria-pressed", "false");
        } else {
          this._runOnly = [...this._runOnly, ruleset];
          chip.setAttribute("aria-pressed", "true");
        }
        this._updateFilterToggle();
        void this._runScan();
      }
    }
  }

  private _updateRunOnlyChips(): void {
    for (const chip of this._shadow.querySelectorAll<HTMLElement>(".filter-chip[data-ruleset]")) {
      const active = this._runOnly.includes(chip.dataset.ruleset ?? "");
      chip.setAttribute("aria-pressed", String(active));
    }
  }

  private _handlePanelKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.setAttribute("data-minimized", "");
      return;
    }

    const list = this._shadow.querySelector(".violation-list");
    if (!list) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const toggles = Array.from(list.querySelectorAll<HTMLElement>(".violation-toggle"));
      const current = this._shadow.activeElement as HTMLElement | null;
      const idx = current ? toggles.indexOf(current) : -1;
      const next =
        e.key === "ArrowDown"
          ? (toggles[idx + 1] ?? toggles[0])
          : (toggles[idx - 1] ?? toggles[toggles.length - 1]);
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  }

  private _refreshBody(): void {
    const body = this._shadow.querySelector(".panel-body");
    if (body) {
      body.innerHTML = this._renderBody(this._getFilteredViolations());
      this._bindHighlightEvents();
    }

    const total = this._results?.violations.length ?? 0;
    const countEl = this._shadow.querySelector(".panel-count");
    if (countEl) {
      countEl.textContent = String(total);
      countEl.setAttribute("data-count", String(total));
    }
    const fabCountEl = this._shadow.querySelector(".fab-count");
    if (fabCountEl) {
      fabCountEl.textContent = String(total);
      fabCountEl.setAttribute("data-count", String(total));
    }
    this._updateFilterToggle();
  }

  private _formatViolationsAsMarkdown(violations: Result[]): string {
    const header = `# a11y-hud scan results\n**URL:** ${location.href}\n**Time:** ${new Date().toISOString()}\n\n`;
    const body = violations
      .map((v) => {
        const nodes = v.nodes
          .map((n) => {
            const lines = ["```html", n.html, "```"];
            if (n.failureSummary) lines.push(`*Failure:* ${n.failureSummary}`);
            return lines.join("\n");
          })
          .join("\n\n");
        return [
          "---",
          `### [${(v.impact ?? "minor").toUpperCase()}] ${v.id}`,
          `**Help:** ${v.help}`,
          `**Description:** ${v.description}`,
          `**Affected elements (${v.nodes.length}):**`,
          nodes,
          `**More info:** ${v.helpUrl}`,
        ].join("\n");
      })
      .join("\n\n");
    return header + body;
  }

  private async _copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  private async _copyAll(): Promise<void> {
    const violations = this._results?.violations;
    if (!violations?.length) return;
    await this._copyToClipboard(this._formatViolationsAsMarkdown(violations));
  }

  private async _copySingle(violationIndex: number): Promise<void> {
    const violation = this._getFilteredViolations()[violationIndex];
    if (!violation) return;
    await this._copyToClipboard(this._formatViolationsAsMarkdown([violation]));
  }

  private _hasActiveFilters(): boolean {
    return (
      this._activeSeverities.size > 0 || this._activeLevels.size > 0 || this._runOnly.length > 0
    );
  }

  private _updateFilterToggle(): void {
    const btn = this._shadow.querySelector<HTMLElement>(".btn-panel-title");
    if (!btn) return;
    btn.setAttribute("aria-expanded", String(this._filtersOpen));
    if (this._hasActiveFilters()) {
      btn.setAttribute("data-active", "");
    } else {
      btn.removeAttribute("data-active");
    }
  }

  private _toggleFilters(): void {
    this._filtersOpen = !this._filtersOpen;
    const filters = this._shadow.getElementById("panel-filters");
    filters?.toggleAttribute("data-open", this._filtersOpen);
    this._updateFilterToggle();
  }

  private _toggleKeyboardMode(): void {
    this._keyboardMode = !this._keyboardMode;
    const btn = this._shadow.querySelector<HTMLButtonElement>("#btn-keyboard");
    if (btn) btn.setAttribute("aria-pressed", String(this._keyboardMode));
    this._shadow.querySelector(".panel")?.toggleAttribute("data-kbd-mode", this._keyboardMode);
    if (this._keyboardMode) {
      this._activateKeyboardMode();
    } else {
      this._deactivateKeyboardMode();
    }
  }

  private _activateKeyboardMode(): void {
    const scope = this._getScopeTarget();
    this._kbElements = getFocusableElements(scope);
    const violations = detectKeyboardViolations(this._kbElements, scope);
    this._keyboardCleanup = injectFocusOrderOverlay(this._kbElements);
    const body = this._shadow.querySelector(".panel-body");
    if (body) body.innerHTML = this._renderKeyboardView(this._kbElements, violations);
  }

  private _deactivateKeyboardMode(): void {
    this._keyboardCleanup?.();
    this._keyboardCleanup = undefined;
    this._kbElements = [];
    this._removeHighlight?.();
    this._removeHighlight = undefined;
    const body = this._shadow.querySelector(".panel-body");
    if (body) {
      body.innerHTML = this._renderBody(this._getFilteredViolations());
      this._bindHighlightEvents();
    }
  }

  private _renderKeyboardView(
    elements: FocusableElementInfo[],
    violations: KeyboardViolation[]
  ): string {
    const elementItems = elements
      .map(
        (info) => `
        <li class="kbd-element-item">
          <button class="btn-kbd-element" data-kbd-element="${info.index}" aria-label="Highlight element ${info.index}: ${escapeHtml(info.selector)}">
            <span class="kbd-element-index" aria-hidden="true">${info.index}</span>
            <code class="kbd-element-selector">${escapeHtml(info.selector)}</code>
            <span class="kbd-element-tag">&lt;${info.element.tagName.toLowerCase()}&gt;</span>
            ${info.tabIndex > 0 ? `<span class="kbd-tabindex-badge">tabindex=${info.tabIndex}</span>` : ""}
          </button>
        </li>`
      )
      .join("");

    const violationItems = violations
      .map(
        (v) => `
        <li class="kbd-violation-item">
          <span class="severity-icon" data-severity="serious" aria-hidden="true">${icon("alert-circle")}</span>
          <span class="kbd-violation-msg">${escapeHtml(v.message)}</span>
        </li>`
      )
      .join("");

    return `
      <div class="kbd-mode-view">
        <div class="kbd-mode-header">
          <span class="kbd-mode-stat">
            <span aria-hidden="true">${icon("keyboard")}</span>
            ${elements.length} focusable element${elements.length !== 1 ? "s" : ""}
          </span>
          ${
            violations.length > 0
              ? `<span class="kbd-mode-stat kbd-mode-stat--warn">
                  <span aria-hidden="true">${icon("alert-circle")}</span>
                  ${violations.length} issue${violations.length !== 1 ? "s" : ""}
                </span>`
              : `<span class="kbd-mode-stat kbd-mode-stat--ok">
                  <span aria-hidden="true">${icon("check-circle")}</span>
                  No issues
                </span>`
          }
        </div>
        ${
          violations.length > 0
            ? `<ul class="kbd-violation-list" aria-label="Keyboard issues">${violationItems}</ul>`
            : ""
        }
        ${
          elements.length > 0
            ? `<ul class="kbd-element-list" aria-label="Focusable elements in tab order">${elementItems}</ul>`
            : `<p class="kbd-empty">No focusable elements found in the scoped area.</p>`
        }
      </div>`;
  }

  private _exportIgnoresJson(): void {
    const json = exportIgnores();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "a11y-hud-ignores.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  private _importIgnoresJson(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        importIgnores((evt.target?.result as string | null) ?? "");
        void this._runScan();
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private _getScopeString(): string {
    if (this._scopeSelector) return this._scopeSelector;
    if (this._scopeElement) {
      const el = this._scopeElement;
      if (el.id) return `#${el.id}`;
      return el.tagName.toLowerCase();
    }
    return "document.body";
  }

  private _buildExport(): A11yHudExport | null {
    if (!this._results) return null;
    return {
      version: "1",
      timestamp: new Date().toISOString(),
      url: location.href,
      scope: this._getScopeString(),
      results: this._results,
    };
  }

  private _exportJson(): void {
    const data = this._buildExport();
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "a11y-hud-results.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  exportResults(): string | null {
    const data = this._buildExport();
    return data ? JSON.stringify(data, null, 2) : null;
  }

  private _highlightNode(violationIndex: number, nodeIndex: number): void {
    this._removeHighlight?.();
    this._removeHighlight = undefined;

    const violation = this._getFilteredViolations()[violationIndex];
    if (!violation) return;
    const node = violation.nodes[nodeIndex];
    if (!node) return;

    const el = findElement(node.target) as HTMLElement | null;
    if (!el) return;

    ensureHighlightStyle(document);
    el.setAttribute(HIGHLIGHT_ATTR, "");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    this._removeHighlight = () => el.removeAttribute(HIGHLIGHT_ATTR);
  }
}

customElements.define("a11y-hud", A11yHudElement);
