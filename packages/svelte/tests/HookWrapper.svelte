<script lang="ts">
import { untrack } from "svelte";
import { useA11yHud } from "../src/hook.svelte.js";
import type { UseA11yHudOptions, UseA11yHudReturn } from "../src/types.js";

const {
  getOptions = (): UseA11yHudOptions => ({}),
  onResult,
}: {
  getOptions?: () => UseA11yHudOptions;
  onResult?: (result: UseA11yHudReturn) => void;
} = $props();

const result = useA11yHud(getOptions);
untrack(() => onResult?.(result));
</script>
