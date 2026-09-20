# Backend Template

This is a template for creating a backend service using FastAPI in Python. It includes Swagger OpenAPI support, a Dockerfile setup, and unit testing via pytest.

## Tech Stack
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- Python 3.12 (slim)
- Uvicorn - ASGI server
- Pytest - Testing framework

## Local Development (using `uv`)

```bash
# Install dependencies
uv pip install -r requirements.txt

# Run the server
uvicorn main:app --reload

# Run tests
pytest tests/
```

## Running via Docker
The application is built to run on port 8000 via Docker.

```bash
docker build -t backend-template .
docker run -p 8000:8000 backend-template
```

## API Documentation
The Swagger (OpenAPI) UI is automatically served by FastAPI. When running behind the Nginx reverse proxy in this monorepo, access the Swagger UI at:
- `http://localhost:8000/api/template/docs`
