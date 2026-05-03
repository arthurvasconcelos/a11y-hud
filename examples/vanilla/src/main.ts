import { mount } from "a11y-hud";

const hud = mount({ theme: "auto" });

(window as Window & { __hud?: typeof hud }).__hud = hud;
