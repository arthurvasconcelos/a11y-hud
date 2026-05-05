import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitepress";

const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../packages/core/package.json"), "utf-8")
) as { version: string };

export default defineConfig({
  title: "a11y-hud",
  description:
    "Framework-agnostic dev overlay that runs axe-core accessibility audits in your running app — no DevTools required.",
  lang: "en-US",
  base: process.env.DOCS_BASE ?? "/a11y-hud/",

  head: [
    ["link", { rel: "icon", href: "/a11y-hud/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#cba6f7" }],
  ],

  themeConfig: {
    logo: { src: "/favicon.svg", alt: "a11y-hud logo" },

    nav: [
      { text: "Guide", link: "/guide/", activeMatch: "/guide/" },
      { text: "Reference", link: "/reference/api", activeMatch: "/reference/" },
      { text: "Cookbook", link: "/cookbook/", activeMatch: "/cookbook/" },
      {
        text: `v${version}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/arthurvasconcelos/a11y-hud/blob/main/CHANGELOG.md",
          },
          {
            text: "Contributing",
            link: "https://github.com/arthurvasconcelos/a11y-hud/blob/main/CONTRIBUTING.md",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        { text: "Getting Started", link: "/guide/" },
        {
          text: "Framework Guides",
          items: [
            { text: "Vanilla / Script tag", link: "/guide/vanilla" },
            { text: "React", link: "/guide/react" },
            { text: "Vue 3", link: "/guide/vue" },
            { text: "Angular", link: "/guide/angular" },
            { text: "Svelte 5", link: "/guide/svelte" },
            { text: "Solid", link: "/guide/solid" },
            { text: "Astro", link: "/guide/astro" },
            { text: "Qwik", link: "/guide/qwik" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "API", link: "/reference/api" },
            { text: "Theming", link: "/reference/theming" },
          ],
        },
      ],
      "/cookbook/": [
        {
          text: "Cookbook",
          items: [
            { text: "Overview", link: "/cookbook/" },
            { text: "Route-change rescans", link: "/cookbook/route-change-rescans" },
            { text: "CI integration", link: "/cookbook/ci-integration" },
            { text: "Custom severity colors", link: "/cookbook/custom-severity-colors" },
            { text: "CSP compatibility", link: "/cookbook/csp-compatibility" },
            { text: "Bookmarklet usage", link: "/cookbook/bookmarklet" },
            { text: "Ignore-rules workflow", link: "/cookbook/ignore-rules" },
            { text: "Keyboard mode", link: "/cookbook/keyboard-mode" },
            { text: "Security model", link: "/cookbook/security-model" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/arthurvasconcelos/a11y-hud" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: 'Icons from <a href="https://lucide.dev/">Lucide</a> (MIT).',
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/arthurvasconcelos/a11y-hud/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
