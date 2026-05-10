# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY --from=builder /app/dist ./dist
COPY server.ts .
COPY src ./src
COPY tsconfig.json .

RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV DB_PATH=/app/data/inventory.db

CMD ["npx", "tsx", "server.ts"]
