# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
