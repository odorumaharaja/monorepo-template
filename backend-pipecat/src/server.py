import os
import uvicorn
from api import app

if __name__ == "__main__":
    # Security requirement: Default to 127.0.0.1 (localhost) for local execution,
    # allow environment variable (e.g. HOST=0.0.0.0) for Docker container environments.
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(
        "api:app",
        host=host,
        port=port,
        reload=False
    )
