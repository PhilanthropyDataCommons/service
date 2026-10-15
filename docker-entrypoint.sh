#!/bin/bash
set -e

node dist/scripts/migrate.js
exec node --import ./dist/instrument.js dist/index.js
