# syntax = docker/dockerfile:1

FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app HERE (this creates .next/standalone)
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy public folder
COPY --from=builder /app/public ./public

# Copy private data folder
COPY --from=builder /app/data ./data

# Copy standalone build (now .next exists because it is built)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
