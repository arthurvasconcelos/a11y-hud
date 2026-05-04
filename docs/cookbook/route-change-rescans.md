# Route-change rescans

Framework adapters rescan after every render commit, which covers most route transitions automatically. This recipe shows the explicit patterns for cases where you need finer control.

## Why adapters handle most cases automatically

- **React**: `useEffect` with no deps fires after every commit, including route-change renders.
- **Vue**: `watchPostEffect` fires after every Vue DOM flush.
- **Angular**: `ngOnChanges` fires when inputs update after navigation.
- **Svelte 5**: `$effect` fires after every reactive update.
- **Solid**: `createEffect` tracks reactive reads, including router signals.

If you mount `<A11yHud>` in your root layout and your router triggers a full re-render on navigation, the rescan happens for free.

## When you need explicit rescans

- The router replaces only the page content region, not the whole tree.
- You want to rescan after an async data load that follows the navigation.
- You need to rate-limit rescans during heavy route transitions.

## React Router

```tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useA11yHud } from "@a11y-hud/react";

function A11yHudWithRouter() {
  const hud = useA11yHud({ theme: "auto" });
  const location = useLocation();

  useEffect(() => {
    // location.pathname changes on every navigation
    hud.runScan();
  }, [location.pathname]);

  return null;
}
```

## Vue Router

```ts
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useA11yHud } from "@a11y-hud/vue";

const hud = useA11yHud({ theme: "auto" });
const route = useRoute();

watch(
  () => route.fullPath,
  () => hud.runScan(),
  { flush: "post" }  // after DOM update
);
```

## Angular Router

```typescript
import { Component, OnInit, inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { A11yHudService } from "@a11y-hud/angular";

@Component({
  standalone: true,
  template: "<a11y-hud-angular [theme]=\"'auto'\" />",
  imports: [],
})
export class RootComponent implements OnInit {
  private hud = inject(A11yHudService);
  private router = inject(Router);

  ngOnInit() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.hud.runScan());
  }
}
```

## SvelteKit

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from "$app/state";
  import { useA11yHud } from "@a11y-hud/svelte";
  import { $effect } from "svelte";

  const hud = useA11yHud(() => ({ theme: "auto" }));

  $effect(() => {
    // track the pathname — re-runs on every navigation
    page.url.pathname;
    hud.runScan();
  });
</script>

<slot />
```

## Solid Router

```tsx
import { createEffect } from "solid-js";
import { useLocation } from "@solidjs/router";
import { createA11yHud } from "@a11y-hud/solid";

function A11yHudWithRouter() {
  const hud = createA11yHud({ theme: "auto" });
  const location = useLocation();

  createEffect(() => {
    // location.pathname is a reactive signal
    location.pathname;
    hud.runScan();
  });

  return null;
}
```

## Vanilla (any router)

```js
import { mount } from "a11y-hud";

const hud = mount({ theme: "auto" });

// Listen to the History API
const originalPushState = history.pushState.bind(history);
history.pushState = (...args) => {
  originalPushState(...args);
  hud.runScan();
};

window.addEventListener("popstate", () => hud.runScan());
```
