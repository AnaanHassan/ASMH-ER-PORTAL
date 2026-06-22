#!/bin/sh
echo "=== Starting AMSH ER Portal ==="
node init-db.cjs 2>&1
echo "Starting Next.js server..."
exec node server.js
