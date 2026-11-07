const port = process.env.LHCI_PORT || "3100";
const origin = `http://127.0.0.1:${port}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `HOSTNAME=127.0.0.1 PORT=${port} pnpm start`,
      startServerReadyPattern: "Ready",
      url: [
        `${origin}/`,
        `${origin}/products`,
        `${origin}/products?q=mascara&category=beauty&sort=price-asc`,
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "lighthouse-reports",
    },
  },
};
