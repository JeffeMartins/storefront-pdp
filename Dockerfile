FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/pdp/package.json apps/pdp/package.json
COPY apps/shell/package.json apps/shell/package.json
RUN npm ci
COPY apps ./apps
ARG APP=pdp
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@aurora/${APP}

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ARG APP=pdp
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/apps/${APP}/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build --chown=node:node /app/apps/${APP}/public ./apps/${APP}/public
ENV APP_NAME=${APP}
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/'+(process.env.APP_NAME==='pdp'?'api/health':'')).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "exec node apps/$APP_NAME/server.js"]
