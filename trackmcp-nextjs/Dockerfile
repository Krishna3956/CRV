# syntax=docker/dockerfile:1

# ---- deps: install production-capable node_modules ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: build the Next.js standalone server ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be provided as build args (not just runtime env).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
ARG NEXT_PUBLIC_LOCAL_DASHBOARD_BYPASS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=$NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
ENV NEXT_PUBLIC_LOCAL_DASHBOARD_BYPASS=$NEXT_PUBLIC_LOCAL_DASHBOARD_BYPASS
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner: minimal image that runs the standalone server ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + traced node_modules
COPY --from=builder /app/.next/standalone ./
# Static assets and public files are NOT bundled into standalone by default
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Next.js ISR writes its prerender cache and segment data under .next at runtime.
# The standalone output is copied as root, so the non-root runtime user cannot
# write to it -> "EACCES: permission denied, mkdir '/app/.next/cache'" spam and
# every page re-renders on each request. Make .next writable by the nextjs user.
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

USER nextjs
EXPOSE 8080
# Force bind to 0.0.0.0: container runtimes auto-set HOSTNAME to the container's
# own hostname, which would override the ENV above and make Next bind the wrong
# interface (App Runner health checks then fail). Setting it inline wins.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 PORT=${PORT:-8080} node server.js"]
