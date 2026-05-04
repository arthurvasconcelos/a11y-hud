# Custom severity colors

Every color in a11y-hud is a CSS custom property. Override any token on the `a11y-hud` element to customize the look.

## Basic override

```css
a11y-hud {
  --a11y-hud-critical: #e53e3e;
  --a11y-hud-serious: #dd6b20;
  --a11y-hud-moderate: #d69e2e;
  --a11y-hud-minor: #3182ce;
}
```

Custom properties pierce the Shadow DOM boundary — they apply to all components inside the Shadow Root.

## Overriding on top of a built-in theme

You can combine a built-in theme with individual overrides:

```js
mount({ theme: "github-dark" });
```

```css
/* Override just the critical color in github-dark */
a11y-hud {
  --a11y-hud-critical: #ff3b30;
}
```

The override wins over the theme value because CSS specificity applies to custom properties at cascade time.

## Building a complete custom theme

Override all tokens for a full custom theme:

```css
a11y-hud {
  /* Backgrounds */
  --a11y-hud-bg: #1c1c1e;
  --a11y-hud-bg-elevated: #2c2c2e;
  --a11y-hud-bg-hover: #3a3a3c;
  --a11y-hud-border: #3a3a3c;

  /* Text */
  --a11y-hud-text: #f5f5f7;
  --a11y-hud-text-muted: #aeaeb2;

  /* Severity (keep semantic family!) */
  --a11y-hud-critical: #ff453a;    /* red */
  --a11y-hud-serious: #ff9f0a;     /* orange */
  --a11y-hud-moderate: #ffd60a;    /* yellow */
  --a11y-hud-minor: #0a84ff;       /* blue */

  /* Accents */
  --a11y-hud-highlight: #bf5af2;   /* purple — WCAG level chips */
  --a11y-hud-tag: #32d74b;         /* teal/green — rule-set chips */
  --a11y-hud-focus-ring: #0a84ff;

  /* Layout */
  --a11y-hud-radius: 6px;
  --a11y-hud-panel-width: 420px;
}
```

## Dynamic theme switching

Switch the built-in theme at runtime and layer overrides:

```js
const hud = mount({ theme: "auto" });

document.getElementById("switch-theme").addEventListener("change", (e) => {
  hud.setTheme(e.target.value);
});
```

CSS overrides stay in effect regardless of which theme is active, because custom property inheritance resolves at render time.

## Reducing the panel width

```css
a11y-hud {
  --a11y-hud-panel-width: 300px;
}
```

## Increasing the z-index

If your app has a modal or overlay with a very high z-index, push the HUD above it:

```css
a11y-hud {
  --a11y-hud-z-index: 2147483647; /* max int */
}
```

## Contrast checking tips

When overriding severity colors, verify they meet WCAG AA (4.5:1 for text, 3:1 for UI components) against the active background tokens.

Good tools for checking:
- [Colour Contrast Analyser (TPGi)](https://www.tpgi.com/color-contrast-checker/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

The chip text color uses `--a11y-hud-bg` (the panel background). When the active chip background is a light color (e.g., yellow for moderate), make sure `--a11y-hud-bg` has sufficient contrast against it.
