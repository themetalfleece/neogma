FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app

# Copy all docs source files first
COPY docs/ ./docs/
# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Remove root prepare script to avoid lint/format needing src/
RUN node -e "const p=require('./package.json'); delete p.scripts.prepare; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

# Install deps - postinstall (fumadocs-mdx) will run and create .source/
RUN pnpm install --frozen-lockfile

# Build Next.js
WORKDIR /app/docs
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/docs/.next/standalone ./
COPY --from=builder /app/docs/.next/static ./docs/.next/static
COPY --from=builder /app/docs/public ./docs/public

USER nextjs

EXPOSE 3000

CMD ["node", "docs/server.js"]
