const CDN_BASE = "https://cdn.jsdelivr.net/npm/a11y-hud";

export function generateBookmarklet(version = "latest"): string {
  const src = `${CDN_BASE}@${version}/dist/index.umd.js`;
  const js = [
    "(function(){",
    "if(window.A11yHud){window.A11yHud.mount();return;}",
    "var s=document.createElement('script');",
    `s.src='${src}';`,
    "s.onload=function(){window.A11yHud.mount();};",
    "document.head.appendChild(s);",
    "})()",
  ].join("");
  return `javascript:${js}`;
}
