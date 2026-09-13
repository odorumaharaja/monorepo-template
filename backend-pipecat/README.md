# backend-pipecat

Real-time speech recognition server using [Pipecat](https://github.com/pipecat-ai/pipecat) and [faster-whisper](https://github.com/SYSTRAN/faster-whisper), with GPU-accelerated inference via NVIDIA CUDA.

## Overview

This service provides a WebSocket-based real-time speech-to-text pipeline:

- **Pipecat**: Manages the audio processing pipeline (WebSocket transport, Silero VAD for voice activity detection)
- **faster-whisper**: CTranslate2-based high-performance Whisper inference
- **FastAPI**: Async web server and WebSocket communication
- **Built-in WebUI**: Vanilla HTML/CSS/JS interface with glassmorphism design and real-time waveform visualization

## Tech Stack

- [Pipecat](https://github.com/pipecat-ai/pipecat) (`pipecat-ai`) — Voice/audio pipeline framework
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — High-speed Whisper inference
- [FastAPI](https://fastapi.tiangolo.com/) — Async web framework
- [Uvicorn](https://www.uvicorn.org/) — ASGI server
- [uv](https://docs.astral.sh/uv/) — Python package and project manager
- NVIDIA CUDA runtime — GPU acceleration

## Running in Monorepo (Recommended)

This service is intended to run as part of the monorepo via Docker Compose. See the [root README](../README.md) for setup instructions.

When running in the monorepo:
- Frontend UI: `http://localhost:8000/pipecat/`
- Backend API & WebUI: `http://localhost:8000/api/pipecat/`
- Direct access (bypassing Nginx): `http://localhost:7860`
- Requires NVIDIA GPU with CUDA support

## Local Development (using `uv`)

```bash
# Install dependencies
uv sync

# Start the server
uv run python src/server.py

# Run tests
uv run pytest
```

The server starts on `http://127.0.0.1:7860` by default.

## Project Structure

```
backend-pipecat/
├── src/
│   ├── server.py        # Uvicorn entry point
│   ├── api.py           # FastAPI app with WebSocket handlers and static WebUI
│   └── static/          # Built-in WebUI static assets
├── models/              # Persisted Whisper model files (auto-downloaded)
├── tests/
│   └── test_main.py     # Unit tests
├── pyproject.toml       # Project metadata and dependencies (uv/hatch)
├── test_api.py          # API import verification script
├── Dockerfile           # Docker image (nvidia/cuda with Python and uv)
└── README.md
```

## Docker

The Dockerfile uses `nvidia/cuda:12.9.2-cudnn-runtime-ubuntu24.04` as the base image and installs Python, ffmpeg, and [uv](https://docs.astral.sh/uv/):

```dockerfile
FROM nvidia/cuda:12.9.2-cudnn-runtime-ubuntu24.04
# Installs python3, ffmpeg, uv
# Runs: uv run python src/server.py
```

Key Docker Compose configuration:
- Port `7860` is exposed to the host for direct access
- `./backend-pipecat/models` is mounted for model file persistence
- `./backend-pipecat/src` is mounted for live code changes
- NVIDIA GPU resources are reserved via the `deploy` section

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | Server bind address (`127.0.0.1` for local, `0.0.0.0` for Docker) |
| `PORT` | `7860` | Server port |
| `WHISPER_MODEL` | `turbo` | Whisper model name (e.g., `base`, `large-v3`, `turbo`, or HuggingFace repo) |
| `WHISPER_DEVICE` | `cuda` | Inference device (`cuda` or `cpu`) |
| `WHISPER_COMPUTE_TYPE` | `float16` | Compute precision (`float16`, `int8`, etc.) |
| `HF_HOME` | `/app/models` | HuggingFace model cache directory |

### Selecting a Whisper Model

Override the model at startup:

```bash
# Using environment variable directly
WHISPER_MODEL=large-v3 docker compose up backend-pipecat

# Or using a HuggingFace repository name
WHISPER_MODEL=Systran/faster-whisper-large-v3 docker compose up backend-pipecat
```

### Model Persistence

Downloaded Whisper models are stored in `./models/` on the host filesystem. Models persist across container restarts and rebuilds, avoiding redundant downloads.

## Running Without GPU (CPU Mode)

For CPU-only execution, override the device and compute type:

```bash
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=int8 docker compose up backend-pipecat
```

> **Note:** Remove or comment out the `deploy.resources.reservations.devices` block in `docker-compose.yml` when running without a GPU.

## Testing

```bash
# Run tests
uv run pytest

# Quick import check
uv run python test_api.py
```

## Security

- The server binds to `127.0.0.1` (localhost only) by default for local execution. The `HOST` environment variable is set to `0.0.0.0` only inside Docker containers.
- The built-in WebUI uses secure DOM manipulation methods (`textContent`, `document.createElement`) instead of `innerHTML` to prevent XSS.

## License

This service is licensed under the [MIT License](../LICENSE).

### Dependency Licenses

- **[Pipecat](https://github.com/pipecat-ai/pipecat)** (`pipecat-ai`): [BSD 2-Clause License](https://github.com/pipecat-ai/pipecat/blob/main/LICENSE) (Copyright (c) Daily)
- **[faster-whisper](https://github.com/SYSTRAN/faster-whisper)** / **[OpenAI Whisper](https://github.com/openai/whisper)**: [MIT License](https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE) (Copyright (c) SYSTRAN / OpenAI)
