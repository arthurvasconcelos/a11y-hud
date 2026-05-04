#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const pkgPath = path.join(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;

function generateBookmarklet(ver) {
  const src = `https://cdn.jsdelivr.net/npm/a11y-hud@${ver}/dist/index.umd.js`;
  return [
    "javascript:(function(){",
    `if(window.A11yHud){window.A11yHud.mount();return;}`,
    `var s=document.createElement('script');`,
    `s.src='${src}';`,
    `s.onload=function(){window.A11yHud.mount();};`,
    `document.head.appendChild(s);`,
    "})()",
  ].join("");
}

const latestUrl = generateBookmarklet("latest");
const pinnedUrl = generateBookmarklet(version);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>a11y-hud &mdash; Bookmarklet</title>
  <style>
    :root {
      --bg: #0d1117;
      --fg: #e6edf3;
      --muted: #7d8590;
      --border: #30363d;
      --accent: #1f6feb;
      --accent-fg: #ffffff;
      --accent-hover: #388bfd;
      --code-bg: #161b22;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #ffffff;
        --fg: #1f2328;
        --muted: #57606a;
        --border: #d0d7de;
        --accent: #0969da;
        --accent-fg: #ffffff;
        --accent-hover: #0860ca;
        --code-bg: #f6f8fa;
      }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
      line-height: 1.5;
    }
    .card {
      max-width: 580px;
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2.5rem;
    }
    .logo { font-size: 0.875rem; font-weight: 600; color: var(--muted); letter-spacing: 0.04em; margin-bottom: 0.25rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.375rem; }
    .tagline { color: var(--muted); font-size: 1rem; margin-bottom: 2.5rem; }
    .steps { display: flex; flex-direction: column; gap: 1.75rem; }
    .step-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 1.5rem; height: 1.5rem; border-radius: 50%;
      background: var(--border); color: var(--fg);
      font-size: 0.75rem; font-weight: 700;
      flex-shrink: 0; margin-right: 0.625rem;
    }
    .step-header { display: flex; align-items: center; font-weight: 600; margin-bottom: 0.625rem; }
    .step-body { color: var(--muted); font-size: 0.9375rem; padding-left: 2.125rem; }
    .bookmarklet-wrap { padding-left: 2.125rem; margin-top: 0.75rem; }
    .bookmarklet-link {
      display: inline-block;
      background: var(--accent);
      color: var(--accent-fg);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: move;
      user-select: none;
      transition: background 0.15s;
    }
    .bookmarklet-link:hover { background: var(--accent-hover); }
    .drag-hint { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--muted); }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    .version-row { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; color: var(--muted); }
    .version-row a { color: var(--fg); text-underline-offset: 3px; }
    code {
      background: var(--code-bg); border: 1px solid var(--border);
      padding: 0.1em 0.4em; border-radius: 4px;
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 0.8125rem;
    }
    .footer { margin-top: 2rem; font-size: 0.8125rem; color: var(--muted); }
    .footer a { color: inherit; text-underline-offset: 3px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">a11y-hud</div>
    <h1>Bookmarklet installer</h1>
    <p class="tagline">Run axe-core accessibility audits on any page &mdash; no extensions required.</p>

    <div class="steps">
      <div class="step">
        <div class="step-header">
          <span class="step-num">1</span>
          Drag to your bookmarks bar
        </div>
        <div class="bookmarklet-wrap">
          <a class="bookmarklet-link" href="${latestUrl}">a11y-hud</a>
          <p class="drag-hint">Drag the button above to your bookmarks bar, or right-click &rarr; &ldquo;Bookmark this link&rdquo;.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <span class="step-num">2</span>
          Click it on any page
        </div>
        <p class="step-body">
          Navigate to any web page and click the bookmark.
          The a11y-hud overlay will appear with a full accessibility scan report.
        </p>
      </div>
    </div>

    <hr>

    <div class="version-row">
      <span>This installer uses <strong>latest</strong>. To pin a specific release:</span>
      <a href="${pinnedUrl}" title="Bookmarklet pinned to v${version}">Pinned to v${version}</a>
    </div>

    <div class="footer">
      <a href="https://github.com/arthurvasconcelos/a11y-hud">github.com/arthurvasconcelos/a11y-hud</a>
      &nbsp;&middot;&nbsp;MIT licence
    </div>
  </div>
</body>
</html>`;

const distDir = path.join(__dirname, "../dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "bookmarklet.html"), html, "utf8");
console.log(`Generated dist/bookmarklet.html (a11y-hud@${version})`);
