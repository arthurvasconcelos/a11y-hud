import { render } from "solid-js/web";
import App from "./App.tsx";

const target = document.getElementById("app");
if (target) render(() => <App />, target);
