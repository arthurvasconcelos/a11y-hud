<script lang="ts">
import { useA11yHud } from "./hook.svelte.js";
import type { A11yHudProps, UseA11yHudOptions } from "./types.js";

const { theme, scope, autoScan, debounce }: A11yHudProps = $props();

useA11yHud(
  (): UseA11yHudOptions => ({
    ...(theme !== undefined && { theme }),
    ...(scope !== undefined && { scope }),
    ...(autoScan !== undefined && { autoScan }),
    ...(debounce !== undefined && { debounce }),
  })
);
</script>
