---
title: Deployment
description: Production build, container image, and delivery pipeline overview.
---

# Deployment

Commerce Lab is delivered as a containerized Next.js standalone service. Deployment configuration is intentionally generic: environment-specific values are supplied by the deployment environment and repository settings rather than committed to the repository.

## Production build

The application uses Next.js standalone output, configured in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

`pnpm build` creates the production build and assembles the standalone directory, including `public/` and `.next/static/`. The resulting server entry point is `server.js`.

`pnpm start` runs that standalone server locally on port 3000.

## Container image

The `Dockerfile` uses a multi-stage build on `node:22-alpine`:

1. **base** enables Corepack and activates pnpm 10.24.0.
2. **deps** installs dependencies with `pnpm install --frozen-lockfile`.
3. **builder** runs `pnpm build`.
4. **runner** copies the standalone output, creates a non-root `nextjs` user, exposes port 3000, and starts `node server.js`.

The image does not include the source tree or development dependencies.

## Compose service

`docker-compose.prod.yml` defines a single `commerce-lab` service:

- It uses the image reference supplied through the `CONTAINER_IMAGE` environment variable.
- It restarts unless stopped.
- It runs with production Node settings and listens on port 3000.
- It joins an external Docker network named by `APP_NETWORK_NAME`.

Both values are provided by the target environment. No registry, host, or network identifiers are stored in the repository.

## Continuous delivery

The `CI` GitHub Actions workflow runs for pushes and pull requests targeting `main` and `milestone/**`.

1. The `Quality checks` job installs with the frozen lockfile, runs the autopilot safety suite, and runs `pnpm verify`.
2. On a push to `main`, the `deploy` job runs after `Quality checks`.
3. The deploy job builds and pushes a Docker image tagged with the commit SHA and a latest tag.
4. It copies the Compose file to the target environment and writes an environment file from repository secrets and variables.
5. It pulls the new image and restarts the service.

Credentials, target access, image naming, and runtime values come from repository secrets and variables. They are not documented here and must never be committed to the repository.

## Deployment expectations

- Merging to `main` is the production release action. Milestone Autopilot never merges into `main`; its final release pull request requires human review.
- A green quality gate and an AI review do not replace functional, security, or architectural review.
- Environment-specific deployment details are managed outside the repository.
- The documentation site is validated in CI but is not published by this repository.

For local development and validation commands, see [Getting Started](/getting-started). For the full quality gate, see [Contributing and Quality](/contributing).
