# ============================================================
# Stone Catalog Pro - Production Dockerfile
# Next.js 16 + Prisma + PostgreSQL + Redis
# Target: ParsPack PaaS
# ============================================================


# ------------------------------------------------------------
# 1. Dependencies
# ------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# فقط فایل‌های dependency
COPY package.json package-lock.json ./

# Prisma schema لازم است چون package.json
# در postinstall دستور prisma generate دارد
COPY prisma ./prisma

# نصب دقیق مطابق package-lock.json
RUN npm ci


# ------------------------------------------------------------
# 2. Builder
# ------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Next.js هنگام build در پروژه فعلی شما DATABASE_URL
# را validate می‌کند.
# این مقدار فقط برای مرحله BUILD است و دیتابیس Production نیست.
ENV DATABASE_URL="postgresql://stone:stone@localhost:5432/stone_catalog?schema=public"

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/prisma ./prisma

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# ایجاد مسیر Storage
RUN mkdir -p /app/storage/uploads

# Build Next.js
RUN npm run build


# ------------------------------------------------------------
# 2.5 Worker — پردازش Jobها و ارسال Webhookها
#
# این مرحله «آخرین» مرحله نیست؛ تصویر پیش‌فرض همچنان runner است
# (مگر با --target worker یا target: worker در compose).
# ------------------------------------------------------------
FROM node:22-alpine AS worker

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# وابستگی‌ها و کلاینت Prisma از مرحله‌ی deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# سورس‌های لازم برای اجرا با tsx
COPY package.json tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

# شرط react-server لازم است چون ماژول‌های سروری از بسته‌ی server-only استفاده می‌کنند
CMD ["npx", "tsx", "--conditions=react-server", "scripts/worker.ts"]


# ------------------------------------------------------------
# 3. Production Runner
# ------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js server
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# ------------------------------------------------------------
# Public files
# ------------------------------------------------------------
COPY --from=builder /app/public ./public


# ------------------------------------------------------------
# Next.js standalone
# ------------------------------------------------------------
COPY --from=builder /app/.next/standalone ./


# ------------------------------------------------------------
# Next.js static assets
# ------------------------------------------------------------
COPY --from=builder /app/.next/static ./.next/static


# ------------------------------------------------------------
# Prisma
# ------------------------------------------------------------
COPY --from=builder /app/prisma ./prisma


# ------------------------------------------------------------
# Application storage
# ------------------------------------------------------------
COPY --from=builder /app/storage ./storage

# اطمینان از وجود مسیر Upload
RUN mkdir -p /app/storage/uploads


# ------------------------------------------------------------
# Application port
# ------------------------------------------------------------
EXPOSE 3000


# ------------------------------------------------------------
# Start
# ------------------------------------------------------------
CMD ["node", "server.js"]