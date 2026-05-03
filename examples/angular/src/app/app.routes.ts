import type { Routes } from "@angular/router";
import { PageAComponent } from "./pages/page-a.component";
import { PageBComponent } from "./pages/page-b.component";

export const routes: Routes = [
  { path: "", component: PageAComponent },
  { path: "page-b", component: PageBComponent },
];
