import { useCallback, useState, useRef, useEffect } from 'react';
import {
  PipecatClientProvider,
  usePipecatClient,
  usePipecatClientTransportState,
  usePipecatClientMediaTrack,
  useRTVIClientEvent,
} from '@pipecat-ai/client-react';
import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { WebSocketTransport, ProtobufFrameSerializer } from '@pipecat-ai/websocket-transport';
import { Mic, MicOff, Activity } from 'lucide-react';
import { useAudioVolume } from './hooks/useAudioVolume';
import './App.css';

interface Transcript {
  text: string;
  final: boolean;
}

// Initialize the WebSocket Transport
const transport = new WebSocketTransport({
  wsUrl: `ws://${window.location.host}/api/pipecat/ws`, // Automatically use the host
  serializer: new ProtobufFrameSerializer(),
});

// Initialize the Pipecat Client
const client = new PipecatClient({
  transport,
});

function VoiceApp() {
  const transportState = usePipecatClientTransportState();
  const pcClient = usePipecatClient();
  const localAudioTrack = usePipecatClientMediaTrack('audio', 'local');
  const volume = useAudioVolume(localAudioTrack);
  
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [autoTurnOff, setAutoTurnOff] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'ok' | 'error'>('checking');
  
  const autoTurnOffRef = useRef(autoTurnOff);

  useEffect(() => {
    autoTurnOffRef.current = autoTurnOff;
  }, [autoTurnOff]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/pipecat/model/info');
        setBackendHealth(res.ok ? 'ok' : 'error');
      } catch (err) {
        setBackendHealth('error');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = ["ready", "connected"].includes(transportState);

  const handleConnect = async () => {
    try {
      await pcClient?.connect();
    } catch (e) {
      console.error('Connection error:', e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await pcClient?.disconnect();
      setTranscripts([]);
    } catch (e) {
      console.error('Disconnection error:', e);
    }
  };

  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data: Transcript) => {
      setTranscripts((prev) => {
        const updated = [...prev, data];
        return updated.slice(-10);
      });

      if (data.final && autoTurnOffRef.current) {
        pcClient?.disconnect().catch(console.error);
      }
    }, [pcClient])
  );

  useRTVIClientEvent(
    RTVIEvent.UserStartedSpeaking,
    useCallback(() => {
      setIsSpeaking(true);
    }, [])
  );

  useRTVIClientEvent(
    RTVIEvent.UserStoppedSpeaking,
    useCallback(() => {
      setIsSpeaking(false);
    }, [])
  );

  return (
    <div className="app-container">
      <div className="glass-panel main-panel">
        <header className="header">
          <div className="logo-container">
            <Activity className="logo-icon" />
            <h1>Pipecat Voice AI</h1>
          </div>
          <div className={`status-badge ${backendHealth === 'ok' ? 'connected' : backendHealth === 'error' ? 'disconnected' : 'connecting'}`}>
            <div className="status-indicator"></div>
            {backendHealth === 'ok' ? 'Backend: OK' : backendHealth === 'error' ? 'Backend: Offline' : 'Backend: Checking...'}
          </div>
        </header>

        <main className="content">
           <div className="transcription-box">
             {transcripts.length === 0 ? (
               <div className="empty-state">
                 <Mic className="empty-icon" />
                 <p>Connect and start speaking to see transcription...</p>
               </div>
             ) : (
               transcripts.map((t, idx) => (
                 <div key={idx} className={`transcript-bubble ${t.final ? 'final' : 'interim'}`}>
                   <span className="sender">User</span>
                   <p className="text">{t.text}</p>
                 </div>
               ))
             )}
           </div>
        </main>

        <footer className="controls">
          <div className="main-button-container">
            {isConnected ? (
              <button 
                className={`control-btn big-mic-btn active ${isSpeaking ? 'speaking' : ''}`} 
                onClick={handleDisconnect} 
                title="Disconnect (Mic OFF)"
                style={{ transform: `scale(${1 + volume * 0.2})` }}
              >
                <Mic size={36 + volume * 24} className="mic-icon" />
              </button>
            ) : (
              <button className="control-btn big-mic-btn muted" onClick={handleConnect} title="Connect (Mic ON)">
                <MicOff size={36} className="mic-icon" />
              </button>
            )}

            <div className="auto-off-switch">
              <label>
                <input 
                  type="checkbox" 
                  checked={autoTurnOff} 
                  onChange={(e) => setAutoTurnOff(e.target.checked)} 
                />
                <span className="slider"></span>
                Auto-OFF
              </label>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <PipecatClientProvider client={client}>
      <VoiceApp />
    </PipecatClientProvider>
  );
}

export default App;
