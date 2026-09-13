# Monorepo Template

A scalable monorepo template containing multiple frontends and backends, orchestrated using Docker Compose with an Nginx reverse proxy.

## Architecture

```
monorepo-template/
├── frontend-admin/      # Admin dashboard (Vite + React + TypeScript)
├── frontend-user/       # User-facing app (Vite + React + TypeScript)
├── frontend-pipecat/    # Pipecat real-time speech recognition UI (Vite + React + TypeScript)
├── backend-admin/       # Admin API (FastAPI + Python 3.12)
├── backend-user/        # User API (FastAPI + Python 3.12)
├── backend-pipecat/     # Pipecat speech recognition server (FastAPI + faster-whisper, NVIDIA GPU)
├── nginx/               # Reverse proxy configuration
├── scripts/             # Build, start, and stop helper scripts
└── docker-compose.yml   # Service orchestration
```

### Services

| Service | Technology | Base Image | Port (Internal) |
|---|---|---|---|
| `frontend-admin` | Vite + React + TypeScript | `node:24-alpine` | 5173 |
| `frontend-user` | Vite + React + TypeScript | `node:24-alpine` | 5173 |
| `frontend-pipecat` | Vite + React + TypeScript + Pipecat Client SDK | `node:24-alpine` | 5173 |
| `backend-admin` | FastAPI + Uvicorn | `python:3.12-slim` | 8000 |
| `backend-user` | FastAPI + Uvicorn | `python:3.12-slim` | 8000 |
| `backend-pipecat` | FastAPI + Pipecat + faster-whisper | `nvidia/cuda:12.9.2-cudnn-runtime-ubuntu24.04` | 7860 |
| `nginx` | Nginx | `nginx:alpine` | 80 → host 8000 |

## Prerequisites

- Docker and Docker Compose
- NVIDIA Container Toolkit (required only for `backend-pipecat` GPU inference)
- Node.js (optional, for local frontend development outside Docker)

## Getting Started

### 1. Build Docker Images

```bash
./scripts/build-images.sh
```

### 2. Install Frontend Dependencies & Build

Install `node_modules` and generate production `dist` bundles on the host filesystem. This step enables offline execution later.

```bash
./scripts/build-frontend.sh
```

### 3. Start the Application

```bash
./scripts/start.sh
```

### 4. Access the Applications

The Nginx reverse proxy listens on `localhost:8000` and routes traffic as follows:

| URL | Description |
|---|---|
| `http://localhost:8000/user/` | User Frontend |
| `http://localhost:8000/admin/` | Admin Frontend |
| `http://localhost:8000/pipecat/` | Pipecat Speech Recognition Frontend |
| `http://localhost:8000/api/user/docs` | User API (Swagger UI) |
| `http://localhost:8000/api/admin/docs` | Admin API (Swagger UI) |
| `http://localhost:8000/api/pipecat/` | Pipecat Backend API & WebUI |

> **Note:** The root URL (`http://localhost:8000/`) redirects to the User Frontend by default.

### 5. Stop the Application

```bash
./scripts/stop.sh
```

## Pipecat Service (GPU-Accelerated Speech Recognition)

The `backend-pipecat` service provides real-time speech-to-text using [Pipecat](https://github.com/pipecat-ai/pipecat) and [faster-whisper](https://github.com/SYSTRAN/faster-whisper). It requires an NVIDIA GPU with CUDA support.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `WHISPER_MODEL` | `turbo` | Whisper model name (e.g., `base`, `large-v3`, `turbo`) |
| `WHISPER_DEVICE` | `cuda` | Inference device (`cuda` or `cpu`) |
| `WHISPER_COMPUTE_TYPE` | `float16` | Compute precision (`float16`, `int8`, etc.) |
| `HF_HOME` | `/app/models` | Directory for model file persistence |

These can be overridden via a `.env` file or by passing them directly:

```bash
WHISPER_MODEL=large-v3 docker compose up backend-pipecat
```

Downloaded model files are persisted in `./backend-pipecat/models/` on the host, so they survive container restarts without re-downloading.

### Running Without GPU (CPU Mode)

Set the following environment variables for CPU-only execution:

```bash
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=int8 docker compose up backend-pipecat
```

> **Note:** The `deploy.resources.reservations.devices` block in `docker-compose.yml` must be removed or commented out when running without a GPU.

## Nginx Routing

All traffic flows through the Nginx reverse proxy on port 8000.

- **Frontends** (`/user/`, `/admin/`, `/pipecat/`): Proxied to their respective Vite dev servers on port 5173. WebSocket upgrade headers are included for HMR support.
- **Backend APIs** (`/api/user/`, `/api/admin/`): Proxied to FastAPI on port 8000, with the location prefix stripped (trailing-slash `proxy_pass`).
- **Pipecat API** (`/api/pipecat/`): Proxied to the Pipecat server on port 7860, with WebSocket upgrade support for real-time audio streaming.

## Adding a New Service

To add a new frontend or backend to the monorepo:

1. **Create the application directory**: Scaffold your new app (e.g., `frontend-new` or `backend-new`) and add a `Dockerfile` following the patterns of existing services.
2. **Update `docker-compose.yml`**:
   - Add the new service under `services:` with volume mappings and environment variables.
   - Add the service name to the `depends_on` list of the `nginx` service.
3. **Update Nginx routing (`nginx/nginx.conf`)**:
   - For frontends: add a `location` block with `proxy_pass http://frontend-new:5173;` (no trailing slash) and WebSocket headers.
   - For backends: add a `location` block with `proxy_pass http://backend-new:8000/;` (with trailing slash) and set the `root_path` in FastAPI accordingly.
4. **Update build script (`scripts/build-frontend.sh`)**: If it is a frontend, append its directory name to the `APP` loop variable.

## Offline Execution

The build process maps `node_modules` and `dist` directories of all frontends to the host filesystem. After running `./scripts/build-frontend.sh` on a machine with network access:

1. Copy the entire project directory (including `node_modules` and `dist`) to the offline machine.
2. Ensure Docker images are available (pre-built or exported/imported via `docker save`/`docker load`).
3. Run `./scripts/start.sh` — the applications will function normally using locally cached files.

## Testing

### Backend

Run `pytest` inside each `backend-*` directory:

```bash
cd backend-user && pytest
cd backend-admin && pytest
```

For `backend-pipecat` (uses `uv`):

```bash
cd backend-pipecat && uv run pytest
```

### Frontend

Run `npm run lint` inside each `frontend-*` directory:

```bash
cd frontend-user && npm run lint
cd frontend-admin && npm run lint
cd frontend-pipecat && npm run lint
```

## Project Scripts

| Script | Description |
|---|---|
| `scripts/build-images.sh` | Builds all Docker images via `docker compose build` |
| `scripts/build-frontend.sh` | Installs dependencies and builds production assets for all frontends |
| `scripts/start.sh` | Starts all services in detached mode via `docker compose up -d` |
| `scripts/stop.sh` | Stops all services via `docker compose down` |

## License

MIT
