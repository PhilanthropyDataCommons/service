#!/bin/bash
set -e

node dist/scripts/migrate.js
exec node dist/index.js
