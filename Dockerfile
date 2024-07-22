FROM bitnami/node:20.15.1-debian-12-r5

RUN adduser --home /opt/philanthropy-data-commons --uid 902 \
    --disabled-login web

USER web
RUN mkdir -p /opt/philanthropy-data-commons/server
WORKDIR /opt/philanthropy-data-commons/server

COPY --chown=web:web package.json .
COPY --chown=web:web node_modules ./node_modules
COPY --chown=web:web dist ./dist
COPY docker-entrypoint.sh .

CMD ["./docker-entrypoint.sh"]
