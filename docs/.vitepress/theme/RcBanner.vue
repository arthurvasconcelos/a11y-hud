<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const STORAGE_KEY = "a11y-hud-rc-banner-dismissed";
const BANNER_HEIGHT = "40px";
const visible = ref(false);

onMounted(() => {
  visible.value = sessionStorage.getItem(STORAGE_KEY) !== "1";
  if (visible.value) {
    document.documentElement.style.setProperty("--vp-layout-top-height", BANNER_HEIGHT);
  }
});

onUnmounted(() => {
  document.documentElement.style.removeProperty("--vp-layout-top-height");
});

function dismiss() {
  sessionStorage.setItem(STORAGE_KEY, "1");
  visible.value = false;
  document.documentElement.style.setProperty("--vp-layout-top-height", "0px");
}
</script>

<template>
  <div v-if="visible" class="rc-banner" role="banner">
    <span class="rc-banner-text">
      <strong>1.0.0-rc1</strong> is live — 30-day soak window in progress.
      <a
        href="https://github.com/arthurvasconcelos/a11y-hud/issues"
        target="_blank"
        rel="noopener noreferrer"
      >File feedback on GitHub ↗</a>
    </span>
    <button
      class="rc-banner-dismiss"
      type="button"
      aria-label="Dismiss RC notice"
      @click="dismiss"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
.rc-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  height: 40px;
  background: #7c3aed;
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
}

.rc-banner-text {
  flex: 1;
  text-align: center;
}

.rc-banner-text a {
  color: #e9d5ff;
  text-underline-offset: 2px;
}

.rc-banner-text a:hover {
  color: #fff;
}

.rc-banner-dismiss {
  flex-shrink: 0;
  appearance: none;
  background: transparent;
  border: none;
  color: #e9d5ff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
}

.rc-banner-dismiss:hover {
  background: rgb(255 255 255 / 15%);
  color: #fff;
}

.rc-banner-dismiss:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
