import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "Commerce Lab",
  description:
    "Documentation for Commerce Lab, a Next.js product-discovery application with URL-driven search, filtering, sorting, pagination, and comparison.",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["meta", { name: "theme-color", content: "#0f172a" }],
    ["meta", { name: "og:type", content: "website" }],
    [
      "meta",
      {
        name: "og:description",
        content:
          "Project, architecture, development, delivery, and review documentation for Commerce Lab.",
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Overview", link: "/overview" },
      { text: "Development", link: "/getting-started" },
      { text: "Architecture", link: "/architecture" },
      {
        text: "Automation",
        items: [
          { text: "Milestone Autopilot", link: "/milestone-autopilot" },
          { text: "AI Code Review", link: "/ai-code-review" },
          { text: "Autopilot Reference", link: "/AUTOPILOT" },
        ],
      },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Documentation Home", link: "/" },
          { text: "Project Overview", link: "/overview" },
          { text: "Product Discovery", link: "/product-discovery" },
        ],
      },
      {
        text: "Development",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Deployment", link: "/deployment" },
        ],
      },
      {
        text: "Architecture",
        items: [
          { text: "Application Architecture", link: "/architecture" },
          { text: "Product Data and Caching", link: "/product-data" },
        ],
      },
      {
        text: "Delivery",
        items: [
          { text: "Contributing and Quality", link: "/contributing" },
          { text: "Milestone Autopilot", link: "/milestone-autopilot" },
          { text: "Autopilot Reference", link: "/AUTOPILOT" },
          { text: "AI Code Review", link: "/ai-code-review" },
        ],
      },
    ],
    outline: {
      level: [2, 3],
      label: "On this page",
    },
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/fzemmel/commerce-lab" },
    ],
    editLink: {
      pattern: "https://github.com/fzemmel/commerce-lab/edit/main/docs/:path",
      text: "Edit this page",
    },
    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },
    footer: {
      message: "Commerce Lab documentation",
      copyright: "Built with VitePress",
    },
  },
});
