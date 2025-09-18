FROM docker.io/node:24-bookworm-slim

RUN apt-get update && apt-get install -y curl
RUN adduser --home /opt/philanthropy-data-commons --uid 1002 \
    --disabled-login web

USER web
RUN mkdir -p /opt/philanthropy-data-commons/server
WORKDIR /opt/philanthropy-data-commons/server

COPY --chown=web:web package.json .
COPY --chown=web:web node_modules ./node_modules
COPY --chown=web:web dist ./dist
COPY docker-entrypoint.sh .

CMD ["./docker-entrypoint.sh"]
