module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready",
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/products",
        "http://localhost:3000/products?q=mascara&category=beauty&sort=price-asc",
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
