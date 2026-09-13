# backend-admin

Admin REST API built with [FastAPI](https://fastapi.tiangolo.com/) and Python 3.12.

## Tech Stack

- [FastAPI](https://fastapi.tiangolo.com/) — Async web framework with automatic OpenAPI docs
- [Uvicorn](https://www.uvicorn.org/) — ASGI server
- [pytest](https://docs.pytest.org/) — Testing framework
- [httpx](https://www.python-httpx.org/) — HTTP client for testing

## Running in Monorepo (Recommended)

This service is intended to run as part of the monorepo via Docker Compose. See the [root README](../README.md) for setup instructions.

When running in the monorepo:
- API is accessible at: `http://localhost:8000/api/admin/`
- Swagger UI: `http://localhost:8000/api/admin/docs`
- The `root_path` is set to `/api/admin` for correct OpenAPI doc generation behind Nginx

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root endpoint (returns `{"Hello": "Admin"}`) |
| `GET` | `/health` | Health check (returns `{"status": "ok"}`) |

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pytest
```

## Project Structure

```
backend-admin/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker image definition (python:3.12-slim)
└── tests/
    └── test_main.py     # Unit tests
```

## Docker

The Dockerfile uses `python:3.12-slim` as the base image:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

In the Docker Compose setup, the project directory is mounted as a volume for live code reloading.

## Testing

```bash
pytest
```

Tests use FastAPI's `TestClient` for synchronous HTTP testing.

## Environment Variables

| Variable | Description |
|---|---|
| `APP_ENV` | Application environment (set to `development` by Docker Compose) |
