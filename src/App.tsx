import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer, DataConnection } from 'peerjs';
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

// --- COMPONENTS ---

const ChocolateHeader = () => (
  <div className="fixed top-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none">
    <svg className="relative block w-full h-[60px] md:h-[100px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#3C1F00"></path>
    </svg>
  </div>
);

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

const HomeView = ({ onFileSelect }: { onFileSelect: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
    </motion.div>
  );
};

const SenderView = ({ file, onCancel }: { file: File; onCancel: () => void }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const shareUrl = peerId ? `${window.location.origin}${window.location.pathname}#/receive/${peerId}` : '';

  useEffect(() => {
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
        conn.send({ 
          type: 'metadata', 
          name: file.name, 
          size: file.size, 
          mime: file.type || 'application/octet-stream' 
        });
      });

      let offset = 0;
      const CHUNK_SIZE = 128 * 1024;

      const sendNextChunk = () => {
        if (offset >= file.size) {
          conn.send({ type: 'eof' });
          return;
        }

        if (conn.dataChannel && conn.dataChannel.bufferedAmount > 1024 * 1024 * 8) {
          setTimeout(sendNextChunk, 50);
          return;
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            conn.send({ type: 'chunk', data: e.target.result });
            offset += CHUNK_SIZE;
            setProgress(Math.min(100, (offset / file.size) * 100));
            setTimeout(sendNextChunk, 0);
          }
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
    });

    return () => { peer.destroy(); };
  }, [file]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 overflow-hidden">
      <div className={`p-4 text-center text-white font-bold flex items-center justify-center gap-2 ${
        status === 'waiting' ? 'bg-[#C68E17]' : status === 'transferring' ? 'bg-blue-500' : status === 'complete' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {status === 'initializing' && <><Loader2 className="animate-spin" /> Generating Link...</>}
        {status === 'waiting' && <><div className="w-3 h-3 bg-white rounded-full animate-pulse" /> Ready</>}
        {status === 'transferring' && <><Loader2 className="animate-spin" /> Sending...</>}
        {status === 'complete' && <><CheckCircle2 /> Complete!</>}
      </div>
      <div className="p-8 flex flex-col items-center">
        <div className="flex items-center gap-3 w-full bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 border border-[#7B3F00]/20">
          <FileBox className="text-[#7B3F00] w-8 h-8" />
          <div className="overflow-hidden text-left">
            <p className="font-bold text-[#3C1F00] truncate">{file.name}</p>
            <p className="text-sm text-[#7B3F00]">{formatBytes(file.size)}</p>
          </div>
        </div>
        {status === 'waiting' && shareUrl && (
          <>
            <div className="bg-white p-4 rounded-2xl border-4 border-[#C68E17] shadow-lg mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`} alt="QR" />
            </div>
            <button 
              onClick={() => { copyToClipboard(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="w-full bg-[#7B3F00] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {copied ? <CheckCircle2 /> : <Copy />} {copied ? "Copied!" : "Copy Link"}
            </button>
          </>
        )}
        {status === 'transferring' && <ProgressBar progress={progress} statusText="Sending..." />}
        {(status === 'error' || status === 'complete') && (
          <button onClick={onCancel} className="mt-6 w-full py-3 font-bold text-[#7B3F00] hover:bg-gray-100 rounded-xl">Back</button>
        )}
      </div>
    </motion.div>
  );
};

const ReceiverView = ({ senderId }: { senderId: string }) => {
  const [status, setStatus] = useState('connecting');
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(senderId, { reliable: true });
      let chunks: Blob[] = [];
      let receivedSize = 0;

      conn.on('data', (data: any) => {
        if (data.type === 'metadata') {
          setMetadata(data);
          setStatus('receiving');
          conn.send({ type: 'ready' });
        } else if (data.type === 'chunk') {
          chunks.push(new Blob([data.data]));
          receivedSize += data.data.byteLength;
          if (metadata) setProgress((receivedSize / metadata.size) * 100);
        } else if (data.type === 'eof') {
          const blob = new Blob(chunks, { type: metadata.mime });
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setStatus('complete');
          conn.send({ type: 'done' });
          const a = document.createElement('a');
          a.href = url; a.download = metadata.name; a.click();
        }
      });
    });
    return () => { peer.destroy(); };
  }, [senderId, metadata]);

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 rounded-3xl shadow-2xl p-8 text-center border border-[#7B3F00]/10">
      <h2 className="text-2xl font-bold mb-4">{status === 'complete' ? 'Success!' : 'Receiving...'}</h2>
      {metadata && (
        <div className="bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 text-left border border-[#7B3F00]/20">
          <p className="font-bold truncate">{metadata.name}</p>
          <p className="text-sm opacity-70">{formatBytes(metadata.size)}</p>
        </div>
      )}
      {status === 'receiving' && <ProgressBar progress={progress} statusText="Downloading..." />}
      {status === 'complete' && downloadUrl && (
        <a href={downloadUrl} download={metadata.name} className="bg-[#7B3F00] text-white px-8 py-3 rounded-full font-bold inline-block">Download Again</a>
      )}
    </div>
  );
};

export default function App() {
  const [route, setRoute] = useState('home');
  const [fileToShare, setFileToShare] = useState<File | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/receive/')) {
        setReceiverId(hash.replace('#/receive/', ''));
        setRoute('receive');
      } else if (fileToShare) {
        setRoute('send');
      } else {
        setRoute('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fileToShare]);

  return (
    <div className="min-h-screen bg-[#FFFDD0] text-[#3C1F00] flex flex-col items-center justify-center p-4">
      <ChocolateHeader />
      <div className="z-10 w-full">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-[#3C1F00] rounded-xl flex items-center justify-center shadow-lg"><span className="text-2xl font-black text-[#FFFDD0]">C</span></div>
          <h1 className="text-4xl font-black">Chocoshare</h1>
        </div>
        <AnimatePresence mode="wait">
          {route === 'home' && <HomeView onFileSelect={(f) => { setFileToShare(f); window.location.hash = '#/send'; }} />}
          {route === 'send' && fileToShare && <SenderView file={fileToShare} onCancel={() => { setFileToShare(null); window.location.hash = ''; }} />}
          {route === 'receive' && receiverId && <ReceiverView senderId={receiverId} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
