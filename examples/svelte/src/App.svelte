<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { A11yHud } from "@a11y-hud/svelte";

// biome-ignore lint/correctness/noUnusedVariables: used in template
let scopeEnabled = $state(false);
// biome-ignore lint/correctness/noUnusedVariables: used in template
let scopeSection = $state<HTMLDivElement | null>(null);
// biome-ignore lint/correctness/noUnusedVariables: used in template
let extraTabindex = $state(false);
// biome-ignore lint/correctness/noUnusedVariables: used in template
let page = $state<"a" | "b">("a");
</script>

<A11yHud scope={scopeEnabled ? scopeSection : undefined} />

<nav>
  <a href="/" onclick={(e) => { e.preventDefault(); page = "a"; }}>Page A</a>
  <a href="/page-b" onclick={(e) => { e.preventDefault(); page = "b"; }}>Page B</a>
</nav>

<div class="controls">
  <button id="btn-toggle-scope" type="button" onclick={() => (scopeEnabled = !scopeEnabled)}>
    {scopeEnabled ? "Disable scope" : "Enable scope"}
  </button>
  <button id="btn-add-violation" type="button" onclick={() => (extraTabindex = true)}>
    Add violation
  </button>
</div>

{#if extraTabindex}
  <button
    type="button"
    tabindex={5}
    style="opacity: 0; position: absolute; pointer-events: none"
  >Positive tabindex</button>
{/if}

<!-- This unlabelled input is outside the scope section. -->
<input type="text" placeholder="Search (no label)" />

<div bind:this={scopeSection}>
  {#if page === "a"}
    <main>
      <h1>Page A — Fixture violations</h1>
      <p>This page contains intentional accessibility violations used to test the HUD.</p>
      <img src="https://via.placeholder.com/150" width="150" height="150" />
      <button type="button" style="width: 32px; height: 32px" />
    </main>
  {:else}
    <main>
      <h1>Page B — Clean page</h1>
      <p>No intentional violations on this page.</p>
    </main>
  {/if}
</div>
