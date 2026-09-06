FROM nvidia/cuda:12.6.3-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Python and system dependencies (ffmpeg is required for audio handling)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Create directory for model persistence
RUN mkdir -p /app/models

# Copy dependency definition files AND README.md (required by hatchling build backend)
COPY pyproject.toml uv.lock README.md ./

# Install project dependencies
RUN uv sync --frozen --no-cache

# Copy application source code
#COPY src ./src

# Default environment variables for container runtime
ENV HOST=0.0.0.0
ENV PORT=7860
ENV WHISPER_MODEL=turbo
ENV WHISPER_DEVICE=cuda
ENV WHISPER_COMPUTE_TYPE=float16
ENV HF_HOME=/app/models

EXPOSE 7860

CMD ["uv", "run", "python", "src/server.py"]