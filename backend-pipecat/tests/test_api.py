import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import sys
import os

# Add src to Python path so we can import api
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Mock faster_whisper module to prevent model loading and avoid __init__ patch errors
import sys
from types import ModuleType

class DummyWhisperModel:
    def __init__(self, *args, **kwargs):
        pass

dummy_faster_whisper = ModuleType('faster_whisper')
dummy_faster_whisper.WhisperModel = DummyWhisperModel
sys.modules['faster_whisper'] = dummy_faster_whisper

from api import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_model_info():
    response = client.get("/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "model" in data
    assert "device" in data
    assert "compute_type" in data
    assert data["model"] == "turbo" # default

def test_restart_model():
    response = client.post("/model/restart")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "STT model restart request accepted." in data["message"]

def test_websocket_endpoint():
    # A simple test to ensure the websocket route is registered and accepts connections
    # We will just connect and then immediately close to test the handshake
    try:
        with client.websocket_connect("/ws") as websocket:
            # We don't send anything, just checking the connection opens successfully
            pass
    except Exception as e:
        pytest.fail(f"WebSocket connection failed: {e}")
