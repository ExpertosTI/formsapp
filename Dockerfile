# Imagen ligera: Next.js se compila EN EL HOST (scripts/deploy-only.sh).
# Docker solo empaqueta el standalone — sin apt-get ni npm (evita fallos DNS en Docker).
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
