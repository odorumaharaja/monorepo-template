#!/bin/bash
set -e

echo "Stopping monorepo services..."
docker compose down

echo "Services stopped successfully."
