#!/bin/bash
set -e

echo "Building Docker images..."
docker compose build

echo "Installing frontend dependencies and building production assets..."
# Use a temporary node container mapped to our frontend directories to install and build.
# This ensures node_modules and dist are created on the host filesystem for offline execution.
for APP in frontend-admin frontend-user; do
  echo "=> Processing $APP"
  docker compose run --rm $APP sh -c "npm install && npm run build"
done

echo "Build complete! node_modules and dist folders are now populated on your host."
