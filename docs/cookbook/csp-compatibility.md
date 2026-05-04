# CSP compatibility

a11y-hud is a dev tool — it typically runs in environments where CSP is either absent or loosely configured. This guide covers what you need if your development or staging environment enforces a CSP.

## What a11y-hud loads

| Source | When | Description |
|--------|------|-------------|
| `https://cdn.jsdelivr.net/npm/a11y-hud/…` | Bookmarklet, CDN script tag | UMD bundle loaded from jsDelivr |
| `https://cdn.jsdelivr.net/npm/axe-core/…` | (Bundled — no separate load) | axe-core is bundled into `a11y-hud` |
| Inline styles | Always | HUD styles via Constructable Stylesheets inside Shadow DOM |

## npm + bundler path (no CDN)

When you import from npm (`import { mount } from "a11y-hud"`), nothing is loaded from a CDN at runtime. The bundle is served by your own dev server. **No external `script-src` or `connect-src` directives are needed.**

The HUD applies styles using Constructable Stylesheets (`document.adoptedStyleSheets`), which are internal to the Shadow Root. No `<link>` tags, no external stylesheet requests.

The only CSP consideration for the npm path:

```http
Content-Security-Policy: style-src 'unsafe-inline';
```

This is needed because `CSSStyleSheet` with `replaceSync()` is classified as an inline style by some browsers. The fallback path (older Safari) uses a `<style>` element inside Shadow DOM, which also requires `'unsafe-inline'`.

::: tip
`'unsafe-inline'` only covers inline styles, not inline scripts. It does not weaken your `script-src` directive.
:::

## CDN script tag path

If you're loading a11y-hud from jsDelivr:

```http
Content-Security-Policy:
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
```

## Bookmarklet path

The bookmarklet injects a `<script>` tag pointing to jsDelivr. This requires:

```http
Content-Security-Policy:
  script-src 'self' https://cdn.jsdelivr.net;
```

On staging environments with a strict CSP that blocks CDN scripts, the bookmarklet will fail silently (the injected `<script>` is blocked). The fix is to either:

1. **Temporarily relax the CSP** for the staging environment only (common practice — staging is not production).
2. **Use the npm path** instead of the bookmarklet — self-host the bundle and update your bookmarklet URL to point to it.
3. **Create a custom bookmarklet** that points to a self-hosted copy of the UMD bundle.

## axe-core and iframe inspection

axe-core can inspect `<iframe>` contents if the frame is same-origin. Cross-origin iframes are skipped automatically. This is a browser security constraint unrelated to CSP.

## Summary table

| Path | `script-src` | `style-src` | Notes |
|------|-------------|-------------|-------|
| npm + bundler | Not needed | `'unsafe-inline'` | Dev server serves the bundle |
| CDN `<script>` tag | `https://cdn.jsdelivr.net` | `'unsafe-inline'` | |
| Bookmarklet | `https://cdn.jsdelivr.net` | `'unsafe-inline'` | May be blocked on strict staging CSP |
