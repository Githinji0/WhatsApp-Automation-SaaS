### Multi-stage Dockerfile for Render (builds client and server)
FROM node:20-alpine AS builder
WORKDIR /workspace

# Copy everything (monorepo)
COPY . .

# Install and build client
WORKDIR /workspace/client
RUN npm ci --silent
RUN npm run build

# Install server dependencies
WORKDIR /workspace/server
RUN npm ci --omit=dev --silent

### Final image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy server
COPY --from=builder /workspace/server /app

# Copy built client static files into server public (optional)
RUN mkdir -p /app/public
COPY --from=builder /workspace/client/.next /app/.next
COPY --from=builder /workspace/client/public /app/public

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.js"]
