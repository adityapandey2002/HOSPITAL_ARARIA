# Build from the repository root:
#   docker build -f apps/backend/Dockerfile -t dh-araria-backend .
# The build needs the workspace manifests because the backend imports
# @dh-araria/shared, so a per-app context cannot resolve it.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
# bcrypt ships a native addon and alpine has no prebuilt binary for it.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/backend

FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

# The workspace symlink @dh-araria/shared -> ../../packages/shared must resolve,
# so both node_modules and packages/shared travel together. The backend folder
# keeps drizzle/ and scripts/ available for `npm run db:migrate` in the pod.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/packages/shared ./packages/shared

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health/live || exit 1

CMD ["node", "apps/backend/dist/main.js"]
