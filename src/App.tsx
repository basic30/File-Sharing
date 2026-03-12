import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer } from 'peerjs';
import { 
  UploadCloud, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download, 
  Wifi, 
  FileBox, 
  X,
  Share2,
  ShieldCheck
} from 'lucide-react';

// --- COLORS (Tailwind hex values for reference) ---
// Cream/Vanilla: #FFFDD0
// Milk Chocolate: #7B3F00
// Dark Chocolate: #3C1F00
// Caramel/Gold: #C68E17

// --- HELPER: Copy to Clipboard ---
const copyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Copy failed', err);
  }
  document.body.removeChild(textArea);
};

// --- HELPER: Format Bytes ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// ==========================================
// COMPONENTS
// ==========================================

// 1. Decorative Chocolate Melting Header
const ChocolateHeader = () => (
  <div className="fixed top-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none">
    <svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#3C1F00"></path>
    </svg>
  </div>
);

// 2. Progress Bar
const ProgressBar = ({ progress, statusText }: { progress: number; statusText: string }) => (
  <div className="w-full mt-4">
    <div className="flex justify-between text-sm font-semibold text-[#7B3F00] mb-2">
      <span>{statusText}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="h-4 w-full bg-[#FFFDD0] rounded-full border border-[#7B3F00]/20 overflow-hidden shadow-inner">
      <motion.div 
        className="h-full bg-gradient-to-r from-[#C68E17] to-[#7B3F00] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "linear", duration: 0.2 }}
      />
    </div>
  </div>
);

// 3. HOME VIEW (Sender Dropzone)
const HomeView = ({ onFileSelect }: { onFileSelect: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 p-8"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-[#FFFDD0] rounded-full mb-4 shadow-sm border border-[#C68E17]/30">
          <Share2 className="w-10 h-10 text-[#7B3F00]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#3C1F00] mb-2">Share a File</h2>
        <p className="text-[#7B3F00]/80 font-medium">Direct device-to-device transfer. No servers.</p>
      </div>

      <div
        className={`relative border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center ${
          isDragging ? "border-[#C68E17] bg-[#FFFDD0]/50 scale-105" : "border-[#7B3F00]/30 hover:border-[#7B3F00]/60 hover:bg-gray-50"
        }`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" ref={fileInputRef} className="hidden" 
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
        />
        <motion.div animate={{ y: isDragging ? -10 : 0 }}>
          <UploadCloud className={`w-16 h-16 mb-4 ${isDragging ? "text-[#C68E17]" : "text-[#7B3F00]/50"}`} />
        </motion.div>
        <p className="text-xl font-bold text-[#3C1F00] mb-2">
          {isDragging ? "Drop it like it's hot!" : "Drag & Drop your file here"}
        </p>
        <p className="text-sm text-[#7B3F00]/70">or click to browse</p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#7B3F00]/70 font-medium bg-[#FFFDD0]/50 p-3 rounded-xl border border-[#C68E17]/20">
        <ShieldCheck className="w-4 h-4 text-[#C68E17]" />
        Secure WebRTC Data Channel. No limits.
      </div>
    </motion.div>
  );
};

// 4. SENDER VIEW
const SenderView = ({ file, onCancel}: { file: File; onCancel: () => void }) => {
  const [peerId, setPeerId] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, waiting, transferring, complete, error
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const shareUrl = peerId ? `${window.location.origin}${window.location.pathname}#/receive/${peerId}` : '';

  useEffect(() => {
    // Initialize Peer
    const id = `chocoshare-${Math.random().toString(36).substring(2, 12)}`;
    const peer = new Peer(id);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('waiting');
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      
      conn.on('open', () => {
        // Send metadata first
        conn.send({ 
          type: 'metadata', 
          name: file.name, 
          size: file.size, 
          mime: file.type || 'application/octet-stream' 
        });
      });

      // Chunking setup
      let offset = 0;
      const CHUNK_SIZE = 128 * 1024; // 128KB chunks

      const sendNextChunk = () => {
        if (offset >= file.size) {
          conn.send({ type: 'eof' });
          return;
        }

        // Backpressure check to prevent memory crash
        if (conn.dataChannel && conn.dataChannel.bufferedAmount > 1024 * 1024 * 8) {
          setTimeout(sendNextChunk, 50); // Wait for buffer to drain
          return;
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = (e) => {
          conn.send({ type: 'chunk', data: e.target.result });
          offset += CHUNK_SIZE;
          setProgress(Math.min(100, (offset / file.size) * 100));
          setTimeout(sendNextChunk, 0); // Yield to event loop
        };
        reader.readAsArrayBuffer(slice);
      };

      conn.on('data', (data: any) => {
        if (data.type === 'ready') {
          setStatus('transferring');
          sendNextChunk();
        } else if (data.type === 'done') {
          setStatus('complete');
        }
      });

      conn.on('close', () => {
        if (status !== 'complete') setStatus('error');
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('error');
    });

    return () => {
      peer.destroy();
    };
  }, [file]);

  const handleCopy = () => {
    copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 overflow-hidden">
      {/* Header Banner */}
      <div className={`p-4 text-center text-white font-bold flex items-center justify-center gap-2 ${
        status === 'waiting' ? 'bg-[#C68E17]' : 
        status === 'transferring' ? 'bg-blue-500' : 
        status === 'complete' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {status === 'initializing' && <><Loader2 className="animate-spin" /> Generating Secure Link...</>}
        {status === 'waiting' && <><div className="w-3 h-3 bg-white rounded-full animate-pulse" /> Ready to Share</>}
        {status === 'transferring' && <><Loader2 className="animate-spin" /> Transferring Data...</>}
        {status === 'complete' && <><CheckCircle2 /> Transfer Complete!</>}
        {status === 'error' && <><X /> Connection Lost</>}
      </div>

      <div className="p-8 flex flex-col items-center">
        {/* File Info */}
        <div className="flex items-center gap-3 w-full bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 border border-[#7B3F00]/20">
          <FileBox className="text-[#7B3F00] w-8 h-8 flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="font-bold text-[#3C1F00] truncate">{file.name}</p>
            <p className="text-sm text-[#7B3F00]">{formatBytes(file.size)}</p>
          </div>
        </div>

        {status === 'waiting' && shareUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
            <div className="bg-white p-4 rounded-2xl border-4 border-[#C68E17] shadow-lg mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&color=3C1F00`} alt="QR Code" className="w-[180px] h-[180px]" />
            </div>
            
            <div className="w-full flex items-center gap-2 bg-gray-100 p-2 rounded-xl mb-4 border border-gray-200">
              <input type="text" readOnly value={shareUrl} className="bg-transparent flex-1 outline-none text-sm text-gray-600 px-2 truncate" />
              <button onClick={handleCopy} className="bg-[#7B3F00] hover:bg-[#3C1F00] text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold">
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 border border-red-200 w-full">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Keep this window open! The link dies permanently if you close this tab.</p>
            </div>
          </motion.div>
        )}

        {status === 'transferring' && (
          <ProgressBar progress={progress} statusText="Sending file directly..." />
        )}

        {status === 'complete' && (
          <div className="text-center w-full py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <p className="font-bold text-[#3C1F00] text-xl">Sent Successfully!</p>
          </div>
        )}

        {(status === 'error' || status === 'complete') && (
          <button onClick={onCancel} className="mt-6 w-full py-3 font-bold text-[#7B3F00] hover:bg-[#7B3F00]/10 rounded-xl transition-colors">
            Share Another File
          </button>
        )}

        {status === 'waiting' && (
          <button onClick={onCancel} className="mt-4 text-sm text-gray-500 hover:text-red-500 font-semibold underline-offset-2 hover:underline">
            Cancel Transfer
          </button>
        )}
      </div>
    </motion.div>
  );
};

// 5. RECEIVER VIEW
const ReceiverView = ({ senderId }: { senderId: string }) => {
  const [status, setStatus] = useState('connecting'); // connecting, receiving, complete, error
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    const peer = new Peer();
    let conn;

    peer.on('open', () => {
      conn = peer.connect(senderId, { reliable: true });

      let chunks = [];
      let receivedSize = 0;
      let fileMeta = null;

      conn.on('open', () => {
        setStatus('connecting'); // Waiting for metadata
      });

      conn.on('data', (data: any) => {
        if (data.type === 'metadata') {
          fileMeta = data;
          setMetadata(data);
          setStatus('receiving');
          conn.send({ type: 'ready' }); // Tell sender to start streaming chunks
        } 
        else if (data.type === 'chunk') {
          chunks.push(new Blob([data.data]));
          receivedSize += data.data.byteLength;
          if (fileMeta) {
            setProgress((receivedSize / fileMeta.size) * 100);
          }
        } 
        else if (data.type === 'eof') {
          const finalBlob = new Blob(chunks, { type: fileMeta.mime });
          const url = URL.createObjectURL(finalBlob);
          setDownloadUrl(url);
          setStatus('complete');
          conn.send({ type: 'done' });
          
          // Auto trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = fileMeta.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });

      conn.on('close', () => {
        if (status !== 'complete') setStatus('error');
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('error');
    });

    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      peer.destroy();
    };
  }, [senderId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 overflow-hidden">
      <div className={`p-4 text-center text-white font-bold flex items-center justify-center gap-2 ${
        status === 'connecting' ? 'bg-[#C68E17]' : 
        status === 'receiving' ? 'bg-blue-500' : 
        status === 'complete' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {status === 'connecting' && <><Loader2 className="animate-spin" /> Connecting to Sender...</>}
        {status === 'receiving' && <><Download className="animate-bounce" /> Receiving File...</>}
        {status === 'complete' && <><CheckCircle2 /> Download Complete!</>}
        {status === 'error' && <><X /> Link Expired or Broken</>}
      </div>

      <div className="p-8 flex flex-col items-center">
        {metadata && (
          <div className="flex items-center gap-3 w-full bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 border border-[#7B3F00]/20">
            <FileBox className="text-[#7B3F00] w-8 h-8 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="font-bold text-[#3C1F00] truncate">{metadata.name}</p>
              <p className="text-sm text-[#7B3F00]">{formatBytes(metadata.size)}</p>
            </div>
          </div>
        )}

        {status === 'connecting' && !metadata && (
          <div className="py-10 flex flex-col items-center text-[#7B3F00]">
            <Wifi className="w-12 h-12 mb-4 animate-pulse opacity-50" />
            <p className="font-semibold text-center">Looking for sender...<br/>Make sure they haven't closed their tab.</p>
          </div>
        )}

        {status === 'receiving' && (
          <ProgressBar progress={progress} statusText="Downloading directly to your device..." />
        )}

        {status === 'complete' && (
          <div className="text-center w-full py-6">
            <p className="font-semibold text-gray-600 mb-6">If your download didn't start automatically, click below.</p>
            <a 
              href={downloadUrl} 
              download={metadata?.name}
              className="inline-flex items-center justify-center gap-2 bg-[#7B3F00] hover:bg-[#3C1F00] text-white px-8 py-3 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Download className="w-5 h-5" /> Download File Again
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center w-full py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-[#3C1F00] mb-2">Transfer Failed</p>
            <p className="text-sm text-gray-500 mb-6">The sender might have closed their tab, or the link is invalid.</p>
            <button onClick={() => window.location.hash = ''} className="bg-[#7B3F00] text-white px-6 py-2 rounded-full font-bold">
              Go to Homepage
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [route, setRoute] = useState('home'); // home, send, receive
  const [fileToShare, setFileToShare] = useState(null);
  const [receiverId, setReceiverId] = useState(null);

  // Simple Hash Router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/receive/')) {
        const id = hash.replace('#/receive/', '');
        setReceiverId(id);
        setRoute('receive');
      } else if (fileToShare) {
        setRoute('send');
      } else {
        setRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Execute on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fileToShare]);

  const startSharing = (file) => {
    setFileToShare(file);
    setRoute('send');
    window.location.hash = '#/send';
  };

  const cancelSharing = () => {
    setFileToShare(null);
    setRoute('home');
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-[#FFFDD0] text-[#3C1F00] font-sans selection:bg-[#C68E17] selection:text-white flex flex-col relative z-10">
      <ChocolateHeader />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 pt-24 sm:pt-32 relative z-10">
        
        {/* App Logo/Title */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 mb-10 cursor-pointer"
          onClick={() => window.location.hash = ''}
        >
          <div className="w-12 h-12 bg-[#3C1F00] rounded-xl flex items-center justify-center shadow-lg rotate-3 hover:rotate-6 transition-transform">
            <span className="text-2xl font-black text-[#FFFDD0]">C</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm" style={{ color: '#3C1F00' }}>
            Choco<span style={{ color: '#7B3F00' }}>share</span>
          </h1>
        </motion.div>

        {/* View Switcher */}
        <AnimatePresence mode="wait">
          {route === 'home' && (
            <HomeView key="home" onFileSelect={startSharing} />
          )}
          {route === 'send' && fileToShare && (
            <SenderView key="send" file={fileToShare} onCancel={cancelSharing} />
          )}
          {route === 'receive' && receiverId && (
            <ReceiverView key="receive" senderId={receiverId} />
          )}
        </AnimatePresence>

        {/* Global Footer Note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center text-sm font-medium text-[#7B3F00]/60 max-w-sm">
          <p className="flex items-center justify-center gap-1">
            <Wifi className="w-4 h-4" /> For files larger than 1GB, ensure both devices are on a stable Wi-Fi network.
          </p>
        </motion.div>

      </main>
    </div>
  );
}