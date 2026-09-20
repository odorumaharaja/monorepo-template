#!/bin/bash
set -e

echo "Starting monorepo services..."
docker compose up -d

echo "Services started!"
echo "- Nginx Gateway: http://localhost:8000"
echo "- Frontend Template: http://localhost:8000/template/"
echo "- Frontend Pipecat: http://localhost:8000/pipecat/"
echo "- Backend Template API (Swagger): http://localhost:8000/api/template/docs"
