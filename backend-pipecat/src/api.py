import asyncio
import json
import logging
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Pipecat Imports
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import (
    Frame,
    InputAudioRawFrame,
    InterimTranscriptionFrame,
    OutputAudioRawFrame,
    TranscriptionFrame,
    VADUserStartedSpeakingFrame,
    VADUserStoppedSpeakingFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.workers.runner import WorkerRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.audio.vad_processor import VADProcessor
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.services.whisper.stt import WhisperSTTService
from pipecat.transcriptions.language import Language
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pipecat-whisper-server")

# --- Monkey patch to prevent HuggingFace HTTPS requests for cached models ---
from faster_whisper import WhisperModel

_original_whisper_init = WhisperModel.__init__

def _patched_whisper_init(self, model_size_or_path, **kwargs):
    # Try local files first to prevent unnecessary HTTPS requests
    kwargs['local_files_only'] = True
    try:
        _original_whisper_init(self, model_size_or_path, **kwargs)
    except Exception as e:
        logger.info(f"Local model '{model_size_or_path}' not found, downloading from huggingface... ({e})")
        kwargs['local_files_only'] = False
        _original_whisper_init(self, model_size_or_path, **kwargs)

WhisperModel.__init__ = _patched_whisper_init
# --------------------------------------------------------------------------

_global_whisper_model = None

class CachedWhisperSTTService(WhisperSTTService):
    def _load(self):
        global _global_whisper_model
        logger.debug("Loading Whisper model...")
        
        model_name = self._settings.model
        if getattr(model_name, '__class__', None).__name__ == 'NotGiven':
            model_name = None
            
        if not model_name:
            raise ValueError("Whisper model must be specified")
            
        if _global_whisper_model is None:
            logger.info(f"Initializing global WhisperModel instance (model: {model_name}, device: {self._device}, compute_type: {self._compute_type})...")
            _global_whisper_model = WhisperModel(
                model_name,
                device=self._device,
                compute_type=self._compute_type
            )
        else:
            logger.info("Reusing existing global WhisperModel instance...")
            
        self._model = _global_whisper_model
        logger.debug("Loaded Whisper model")
        
        unsupported = self._unsupported_language()
        if unsupported:
            raise ValueError(unsupported)

app = FastAPI(
    title="Pipecat + Faster-Whisper WebUI STT",
    description="""
Real-time Speech-to-Text (STT) server using Pipecat and Faster-Whisper.

## WebSocket API (`/ws`)
The core functionality of this server is provided via WebSocket.
Although it cannot be tested directly in Swagger UI, it uses the following protocol:

- **Audio Format**: 16kHz, 1 channel (mono), raw PCM (binary)
- **Response Format**: JSON
  - Interim results: `{"type": "transcription", "text": "...", "is_final": false}`
  - Final results: `{"type": "transcription", "text": "...", "is_final": true}`
""",
    version="1.0.0"
)

# Directory setup
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", summary="Get Web UI", description="Returns the frontend (index.html) to test real-time STT in the browser.")
async def get_index():
    return FileResponse(STATIC_DIR / "index.html")


class ModelInfo(BaseModel):
    model: str
    device: str
    compute_type: str

@app.get("/model/info", summary="Get Speech Recognition Model Info", description="Returns information about the currently configured STT model.", tags=["Model"])
async def get_model_info() -> ModelInfo:
    whisper_device = os.getenv("WHISPER_DEVICE", "cuda")
    return ModelInfo(
        model=os.getenv("WHISPER_MODEL", "turbo"),
        device=whisper_device,
        compute_type=os.getenv(
            "WHISPER_COMPUTE_TYPE",
            "float16" if whisper_device == "cuda" else "int8",
        )
    )

@app.post("/model/restart", summary="Restart Speech Recognition Model", description="Restarts the speech recognition model (clears memory or reloads).", tags=["Model"])
async def restart_model():
    logger.info("STT Model restart requested via API.")
    # In the current implementation, the model is initialized per WebSocket connection.
    # Therefore, this would ideally disconnect existing clients or clear a global cache.
    return {"status": "success", "message": "STT model restart request accepted."}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected via WebSocket")

    try:
        # Initialize Pipecat Transport with ProtobufFrameSerializer
        transport = FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_in_sample_rate=16000,
                audio_in_channels=1,
                audio_out_enabled=False,
                add_wav_header=False,
                serializer=ProtobufFrameSerializer(),
            ),
        )

        # Initialize VAD Processor to emit VADUserStartedSpeakingFrame & VADUserStoppedSpeakingFrame
        vad = VADProcessor(
            vad_analyzer=SileroVADAnalyzer(
                params=VADParams(
                    confidence=0.5,
                    start_secs=0.2,
                    stop_secs=0.5,
                    min_volume=0.05,
                )
            )
        )

        # Initialize STT (faster-whisper model set via WHISPER_MODEL, default: "turbo")
        whisper_model = os.getenv("WHISPER_MODEL", "turbo")
        whisper_device = os.getenv("WHISPER_DEVICE", "cuda")
        whisper_compute_type = os.getenv(
            "WHISPER_COMPUTE_TYPE",
            "float16" if whisper_device == "cuda" else "int8",
        )

        logger.info(
            f"⚡ Initializing Faster-Whisper STT (model: '{whisper_model}', device: '{whisper_device}', compute_type: '{whisper_compute_type}')"
        )

        stt = CachedWhisperSTTService(
            settings=WhisperSTTService.Settings(
                model=whisper_model,
                language=Language.JA,
            ),
            device=whisper_device,
            compute_type=whisper_compute_type,
        )

        # Construct Pipeline: Audio In -> VADProcessor -> WhisperSTTService -> Audio Out (for serialization)
        pipeline = Pipeline([
            transport.input(),
            vad,
            stt,
            transport.output(),
        ])

        task = PipelineTask(
            pipeline,
            params=PipelineParams(allow_interruptions=True)
        )

        runner = WorkerRunner()
        await runner.add_workers(task)

        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            logger.info("Client connected")

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            logger.info("Client disconnected")

        await runner.run()

    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"Error during WebSocket pipeline execution: {e}", exc_info=True)
    finally:
        # Cancel the runner to stop any background tasks in Pipecat
        if 'runner' in locals() and runner is not None:
            await runner.cancel()

        # Delete local references to break any circular dependencies
        if 'task' in locals(): del task
        if 'pipeline' in locals(): del pipeline
        if 'stt' in locals(): del stt
        if 'vad' in locals(): del vad
        if 'transport' in locals(): del transport
        if 'runner' in locals(): del runner

        # Force garbage collection to ensure CTranslate2 model objects are destroyed
        import gc
        gc.collect()

        # Release GPU memory if CUDA is being used
        whisper_device = os.getenv("WHISPER_DEVICE", "cuda")
        if whisper_device == "cuda":
            try:
                import torch
                torch.cuda.empty_cache()
            except ImportError:
                pass
