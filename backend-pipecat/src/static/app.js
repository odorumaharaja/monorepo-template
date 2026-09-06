document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const micToggle = document.getElementById('mic-toggle');
  const micIconOff = document.getElementById('mic-icon-off');
  const micIconOn = document.getElementById('mic-icon-on');
  const micBtnLabel = document.getElementById('mic-btn-label');
  const instructionText = document.getElementById('instruction-text');
  const transcriptionContainer = document.getElementById('transcription-container');
  const placeholderText = document.getElementById('placeholder-text');
  const clearBtn = document.getElementById('clear-btn');
  const copyBtn = document.getElementById('copy-btn');
  const infoBtn = document.getElementById('info-btn');
  const restartBtn = document.getElementById('restart-btn');
  const canvas = document.getElementById('waveform-canvas');
  const canvasCtx = canvas.getContext('2d');
  const autoStopToggle = document.getElementById('auto-stop-toggle');

  // Load saved auto-stop setting
  const savedAutoStop = localStorage.getItem('auto_stop_first_transcription');
  if (savedAutoStop !== null && autoStopToggle) {
    autoStopToggle.checked = savedAutoStop === 'true';
  }

  if (autoStopToggle) {
    autoStopToggle.addEventListener('change', () => {
      localStorage.setItem('auto_stop_first_transcription', autoStopToggle.checked);
    });
  }

  // State Variables
  let ws = null;
  let audioContext = null;
  let mediaStream = null;
  let scriptProcessor = null;
  let analyserNode = null;
  let animationFrameId = null;
  let isRecording = false;
  let currentInterimElement = null;

  // Initialize Canvas Size
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Connect to WebSocket Server
  function connectWebSocket() {
    updateStatus('connecting', '接続中...');
    micToggle.disabled = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      updateStatus('online', 'オンライン');
      micToggle.disabled = false;
      instructionText.textContent = '「録音開始」ボタンを押して発話してください';
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          handleTranscription(data.text, data.is_final);
        } else if (data.type === 'status') {
          console.log('Server status:', data.message);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      updateStatus('offline', '接続エラー');
      micToggle.disabled = true;
    };

    ws.onclose = () => {
      updateStatus('offline', '未接続');
      micToggle.disabled = true;
      if (isRecording) {
        stopRecording();
      }
      // Retry connection after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
  }

  // Update Status Badge UI
  function updateStatus(state, text) {
    statusBadge.className = 'badge';
    if (state === 'offline') statusBadge.classList.add('badge-offline');
    else if (state === 'connecting') statusBadge.classList.add('badge-connecting');
    else if (state === 'online') statusBadge.classList.add('badge-online');
    else if (state === 'recording') statusBadge.classList.add('badge-recording');

    statusText.textContent = text;
  }

  // Start Audio Recording and Streaming
  async function startRecording() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const sourceNode = audioContext.createMediaStreamSource(mediaStream);
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      sourceNode.connect(analyserNode);

      // ScriptProcessorNode for buffer handling (16kHz 16-bit PCM)
      const bufferSize = 4096;
      scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);

      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecording || !ws || ws.readyState !== WebSocket.OPEN) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16 = convertFloat32ToInt16(inputData);
        ws.send(pcm16.buffer);
      };

      sourceNode.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      isRecording = true;
      micToggle.classList.add('recording');
      micIconOff.classList.add('hidden');
      micIconOn.classList.remove('hidden');
      micBtnLabel.textContent = '停止';
      instructionText.textContent = 'マイクに入力中... 発話が終わると自動的に認識されます';
      updateStatus('recording', '録音中');

      drawWaveform();
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('マイクへのアクセス許可が得られませんでした: ' + err.message);
    }
  }

  // Stop Audio Recording
  function stopRecording() {
    isRecording = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (scriptProcessor) {
      scriptProcessor.disconnect();
      scriptProcessor = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    micToggle.classList.remove('recording');
    micIconOff.classList.remove('hidden');
    micIconOn.classList.add('hidden');
    micBtnLabel.textContent = '録音開始';
    instructionText.textContent = 'ボタンを押してマイク入力を開始してください';
    updateStatus('online', 'オンライン');

    clearWaveformCanvas();
  }

  // Convert Float32Array to Int16Array PCM
  function convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  // Draw Audio Waveform Visualization
  function drawWaveform() {
    if (!isRecording || !analyserNode) return;

    animationFrameId = requestAnimationFrame(drawWaveform);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#6366f1';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  function clearWaveformCanvas() {
    canvasCtx.fillStyle = 'rgba(15, 23, 42, 1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Securely Handle Transcription Display (No innerHTML used)
  function handleTranscription(text, isFinal) {
    if (!text || text.trim() === '') return;

    // Remove placeholder on first message
    if (placeholderText && placeholderText.parentElement) {
      placeholderText.remove();
    }

    if (isFinal) {
      // If there was an interim element, remove it
      if (currentInterimElement) {
        currentInterimElement.remove();
        currentInterimElement = null;
      }

      const itemDiv = document.createElement('div');
      itemDiv.className = 'transcription-item';

      const timeSpan = document.createElement('div');
      timeSpan.className = 'timestamp';
      timeSpan.textContent = new Date().toLocaleTimeString();

      const textSpan = document.createElement('div');
      textSpan.className = 'final-text';
      textSpan.textContent = text;

      itemDiv.appendChild(timeSpan);
      itemDiv.appendChild(textSpan);
      transcriptionContainer.appendChild(itemDiv);

      // Auto-scroll to bottom
      transcriptionContainer.scrollTop = transcriptionContainer.scrollHeight;

      // Auto-stop recording if option is enabled
      if (autoStopToggle && autoStopToggle.checked && isRecording) {
        stopRecording();
      }
    } else {
      // Interim transcription
      if (!currentInterimElement) {
        currentInterimElement = document.createElement('div');
        currentInterimElement.className = 'transcription-item';

        const textSpan = document.createElement('div');
        textSpan.className = 'interim-text';

        currentInterimElement.appendChild(textSpan);
        transcriptionContainer.appendChild(currentInterimElement);
      }

      const interimTextNode = currentInterimElement.querySelector('.interim-text');
      if (interimTextNode) {
        interimTextNode.textContent = text;
      }
      transcriptionContainer.scrollTop = transcriptionContainer.scrollHeight;
    }
  }

  // Toggle Button Event Listener
  micToggle.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // Clear Button Event Listener
  clearBtn.addEventListener('click', () => {
    transcriptionContainer.replaceChildren();
    currentInterimElement = null;

    const newPlaceholder = document.createElement('div');
    newPlaceholder.id = 'placeholder-text';
    newPlaceholder.className = 'placeholder';
    newPlaceholder.textContent = 'マイクに向かって話すと、ここに文字起こし結果がリアルタイム表示されます...';
    transcriptionContainer.appendChild(newPlaceholder);
  });

  // Info Button Event Listener
  if (infoBtn) {
    infoBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/model/info');
        const data = await res.json();
        alert(`Model: ${data.model}\nDevice: ${data.device}\nCompute Type: ${data.compute_type}`);
      } catch (err) {
        alert('Failed to get model info.');
      }
    });
  }

  // Restart Button Event Listener
  if (restartBtn) {
    restartBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/model/restart', { method: 'POST' });
        const data = await res.json();
        alert(data.message);
      } catch (err) {
        alert('Failed to restart model.');
      }
    });
  }

  // Copy Button Event Listener
  copyBtn.addEventListener('click', () => {
    const finalElements = transcriptionContainer.querySelectorAll('.final-text');
    const texts = Array.from(finalElements).map(el => el.textContent);
    if (texts.length === 0) return;

    const fullText = texts.join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'コピー完了!';
      setTimeout(() => {
        copyBtn.replaceChildren();

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '9');
        rect.setAttribute('y', '9');
        rect.setAttribute('width', '13');
        rect.setAttribute('height', '13');
        rect.setAttribute('rx', '2');
        rect.setAttribute('ry', '2');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');

        svg.appendChild(rect);
        svg.appendChild(path);

        copyBtn.appendChild(svg);
        copyBtn.appendChild(document.createTextNode(' コピー'));
      }, 2000);
    });
  });

  // Start WebSocket Connection
  connectWebSocket();
});
