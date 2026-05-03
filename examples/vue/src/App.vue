<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { A11yHud } from "@a11y-hud/vue";
import { ref } from "vue";
// biome-ignore lint/correctness/noUnusedImports: used in template
import { RouterLink, RouterView } from "vue-router";

// biome-ignore lint/correctness/noUnusedVariables: used in template
const scopeEnabled = ref(false);
// biome-ignore lint/correctness/noUnusedVariables: used in template
const scopeSectionRef = ref<HTMLDivElement | null>(null);
// biome-ignore lint/correctness/noUnusedVariables: used in template
const extraTabindex = ref(false);
</script>

<template>
  <A11yHud :scope="scopeEnabled ? scopeSectionRef : undefined" />

  <nav>
    <RouterLink to="/">Page A</RouterLink>
    <RouterLink to="/page-b">Page B</RouterLink>
  </nav>

  <div class="controls">
    <button id="btn-toggle-scope" type="button" @click="scopeEnabled = !scopeEnabled">
      {{ scopeEnabled ? 'Disable scope' : 'Enable scope' }}
    </button>
    <button id="btn-add-violation" type="button" @click="extraTabindex = true">
      Add violation
    </button>
  </div>

  <button
    v-if="extraTabindex"
    type="button"
    :tabindex="5"
    style="opacity: 0; position: absolute; pointer-events: none"
  >
    Positive tabindex
  </button>

  <!-- This unlabelled input is outside the scope section. -->
  <input type="text" placeholder="Search (no label)" />

  <div ref="scopeSectionRef">
    <RouterView />
  </div>
</template>
