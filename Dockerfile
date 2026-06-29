# Imagen ligera: Next.js se compila EN EL HOST (scripts/deploy-only.sh).
FROM node:20-slim AS runner
WORKDIR /app

# OpenSSL para que Prisma detecte el engine correcto (bookworm = openssl 3)
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

# Nunca copiar secretos; vars vienen de docker-compose environment
RUN rm -f .env .env.* 2>/dev/null || true \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
