#!/bin/sh
# Prisma CLI reads DATABASE_URL from the environment or a local .env.
# The demo does not commit .env and does not set a Vercel variable.
# When neither is present, use the SQLite file next to schema.prisma.
if [ -z "$DATABASE_URL" ] && [ ! -f .env ]; then
  export DATABASE_URL="file:./banktruth.db"
fi
exec "$@"
