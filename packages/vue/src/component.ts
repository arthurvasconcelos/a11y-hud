import type { Theme } from "a11y-hud";
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { useA11yHud } from "./composable.js";
import type { A11yHudProps } from "./types.js";

export const A11yHud = defineComponent({
  name: "A11yHud",
  props: {
    theme: {
      type: String as PropType<Theme>,
      default: undefined,
    },
    scope: {
      type: Object as PropType<Element | null>,
      default: undefined,
    },
    autoScan: {
      type: Boolean as PropType<boolean>,
      default: undefined,
    },
    debounce: {
      type: Number as PropType<number>,
      default: undefined,
    },
  },
  setup(props) {
    useA11yHud(props as A11yHudProps);
    return () => null;
  },
});
