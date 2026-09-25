# =========================
# Stage 1: Build
# =========================
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate


# =========================
# Stage 2: Production
# =========================
FROM node:18 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]