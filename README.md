# Monorepo Template

This is a scalable monorepo template containing multiple frontends and backends, orchestrated using Docker Compose.

## Architecture

*   **Frontends**: `frontend-admin`, `frontend-user` (Vite, React, TypeScript)
*   **Backends**: `backend-admin`, `backend-user` (FastAPI, Python 3.12)
*   **Reverse Proxy**: Nginx (routes traffic to appropriate services)

## Prerequisites

*   Docker and Docker Compose installed.
*   Node.js (for local development, though builds run in Docker).

## Getting Started

### 1. Build the Services and Dependencies

First, generate the Docker images:

```bash
./scripts/build-images.sh
```

Next, install frontend dependencies to your host machine. This enables offline execution later:

```bash
./scripts/build-frontend.sh
```

### 2. Start the Application

Start all services in detached mode:

```bash
./scripts/start.sh
```

### 3. Access the Applications

Once started, the Nginx reverse proxy listens on `localhost:8000` and routes traffic as follows:

*   **User Frontend**: `http://localhost:8000/user/`
*   **Admin Frontend**: `http://localhost:8000/admin/`
*   **User API Docs (Swagger)**: `http://localhost:8000/api/user/docs`
*   **Admin API Docs (Swagger)**: `http://localhost:8000/api/admin/docs`

### 4. Stop the Application

```bash
./scripts/stop.sh
```

## Adding a New Service

To add a new frontend or backend to the monorepo, follow these steps:

1.  **Create the Application Directory**: Scaffold your new app (e.g., `frontend-new` or `backend-new`) and add a `Dockerfile` following the patterns of existing services.
2.  **Update `docker-compose.yml`**: Add the new service under `services:` with its volume mappings and environment variables. Also, add the service name to the `depends_on` list of the `nginx` service.
3.  **Update Nginx Routing (`nginx/nginx.conf`)**: Add a new `location` block to proxy traffic to your new service. For frontends, use `proxy_pass http://frontend-new:5173;` (without trailing slash). For backends, use `proxy_pass http://backend-new:8000/;` (with trailing slash) and set the `root_path` in FastAPI.
4.  **Update Build Script (`scripts/build-frontend.sh`)**: If it is a frontend, append its directory name to the `APP` loop variable list so its dependencies are installed automatically on the host.

## Offline Execution

The build process is designed to map the `node_modules` and `dist` directories of the frontends to your host filesystem. If you copy this entire directory to a machine without network access (provided it has the docker images or you exported/imported them), you can simply run `./scripts/start.sh` and the applications will function normally using the locally cached files.

## Testing

*   **Frontend**: Run `npm run test` inside the respective `frontend-*` directories (you may need to configure vitest).
*   **Backend**: Run `pytest` inside the respective `backend-*` directories.
