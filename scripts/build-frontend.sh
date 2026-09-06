#!/bin/bash
set -e

echo "Installing frontend dependencies and building production assets..."
# Use docker compose run to utilize the exact image for each frontend.
# This ensures node_modules and dist are created on the host filesystem for offline execution.
for APP in frontend-admin frontend-user; do
  echo "=> Processing $APP"
  docker compose run --rm $APP sh -c "npm install && npm run build"
done

echo "Frontend build complete! node_modules and dist folders are now populated on your host."
