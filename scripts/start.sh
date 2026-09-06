#!/bin/bash
set -e

echo "Starting monorepo services..."
docker compose up -d

echo "Services started!"
echo "- Nginx Gateway: http://localhost:8000"
echo "- Frontend User: http://localhost:8000/user/"
echo "- Frontend Admin: http://localhost:8000/admin/"
echo "- Backend User API (Swagger): http://localhost:8000/api/user/docs"
echo "- Backend Admin API (Swagger): http://localhost:8000/api/admin/docs"
