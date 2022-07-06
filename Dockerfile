FROM bitnami/node:16.15.1-debian-11-r10

RUN adduser --home /opt/philanthropy-data-commons --uid 902 \
    --disabled-login web

USER web
RUN mkdir -p /opt/philanthropy-data-commons/server
WORKDIR /opt/philanthropy-data-commons/server

COPY --chown=web:web package.json .
COPY --chown=web:web node_modules ./node_modules
COPY --chown=web:web dist ./dist

CMD ["npm", "start"]
