import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer, DataConnection } from 'peerjs';
import { 
  UploadCloud, Copy, CheckCircle2, AlertCircle, Loader2, Download, 
  Wifi, FileBox, X, Share2, ShieldCheck, QrCode, Lock, Zap, Infinity, ArrowRight 
} from 'lucide-react';

const copyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
  document.body.removeChild(textArea);
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ChocolateIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7zm0 2h10v3H7V4zm0 5h4v4H7V9zm6 0h4v4h-4V9zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z"/>
  </svg>
);

const BackgroundShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[5%] w-32 h-32 bg-[#7B3F00]/5 rounded-3xl rotate-12 blur-sm" />
    <motion.div animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[5%] w-48 h-48 bg-[#C68E17]/10 rounded-full blur-md" />
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[40%] right-[15%] w-24 h-24 bg-[#3C1F00]/5 rounded-xl rotate-45 blur-sm" />
  </div>
);

const ChocolateHeader = () => (
  <div className="fixed top-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none opacity-50">
    <svg className="relative block w-full h-[80px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
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
      <motion.div className="h-full bg-gradient-to-r from-[#C68E17] to-[#7B3F00] rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.2 }} />
    </div>
  </div>
);

const ReceiveModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    let peerId = code.trim();
    if (peerId.includes('#/receive/')) {
      peerId = peerId.split('#/receive/')[1];
    }
    
    window.location.hash = `#/receive/${peerId}`;
    onClose();
    setCode('');
  };

  return (
    <div className="fixed inset-0 bg-[#3C1F00]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#7B3F00]/20">
        <div className="bg-[#7B3F00] p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2"><QrCode className="w-6 h-6"/> Receive File</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8">
          <p className="text-[#7B3F00] mb-6 font-medium">Enter the 6-digit code or paste the full link shared by the sender below.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="e.g. 123456" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-4 py-4 rounded-xl border-2 border-[#C68E17]/30 focus:border-[#7B3F00] focus:ring-2 focus:ring-[#7B3F00]/20 outline-none transition-all text-[#3C1F00] font-bold text-center text-xl tracking-widest" autoFocus />
            <button type="submit" disabled={!code.trim()} className="w-full py-4 bg-[#C68E17] hover:bg-[#7B3F00] disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              Connect & Receive <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-[#7B3F00]/10 flex flex-col items-center text-center">
    <div className="w-16 h-16 bg-[#FFFDD0] text-[#7B3F00] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-extrabold text-[#3C1F00] mb-3">{title}</h3>
    <p className="text-[#7B3F00]/80 font-medium leading-relaxed">{desc}</p>
  </motion.div>
);

const HomeView = ({ onFileSelect }: { onFileSelect: (files: File[]) => void }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(Array.from(e.dataTransfer.files));
    }
  }, [onFileSelect]);

  return (
    <div className="w-full flex flex-col items-center pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }} 
        // 👇 Added mt-24 to fix the spacing issue at the top 👇
        className="w-full max-w-xl mx-auto mt-20 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 p-8 md:p-12"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-[#FFFDD0] rounded-full mb-4 shadow-sm border border-[#C68E17]/30">
            <Share2 className="w-10 h-10 text-[#7B3F00]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#3C1F00] mb-2">Share Files Instantly</h2>
          <p className="text-[#7B3F00]/80 font-medium">Direct device-to-device transfer. Fast and Secure.</p>
        </div>

        <div
          className={`relative border-4 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center ${
            isDragging ? "border-[#C68E17] bg-[#FFFDD0]/50 scale-105" : "border-[#7B3F00]/30 hover:border-[#7B3F00]/60 hover:bg-[#FFFDD0]/20"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onFileSelect(Array.from(e.target.files))} />
          <motion.div animate={{ y: isDragging ? -10 : 0 }}>
            <UploadCloud className={`w-16 h-16 mb-4 transition-colors ${isDragging ? "text-[#C68E17]" : "text-[#7B3F00]/50"}`} />
          </motion.div>
          <p className="text-xl font-bold text-[#3C1F00] mb-2">
            {isDragging ? "Drop them like they're hot!" : "Drag & Drop your files here"}
          </p>
          <p className="text-sm text-[#7B3F00]/70 font-semibold bg-[#FFFDD0] px-4 py-1 rounded-full mt-2 border border-[#7B3F00]/10">or click to browse</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="w-full max-w-6xl mx-auto mt-32 px-4"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-[#3C1F00] mb-6 tracking-tight">How ChocoShare Works</h2>
          <p className="text-lg text-[#7B3F00] max-w-2xl mx-auto font-medium">
            Unlike other services, ChocoShare doesn't store your files on a server. We use Peer-to-Peer (P2P) WebRTC technology to connect your device directly to the receiver. It's just you and them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <FeatureCard 
            icon={<Infinity className="w-8 h-8" />} 
            title="No Size Limits" 
            desc="Because files go directly from your device to theirs, there are no cloud storage limits. Send 10MB or 100GB seamlessly." 
          />
          <FeatureCard 
            icon={<Lock className="w-8 h-8" />} 
            title="End-to-End Encrypted" 
            desc="Your files are heavily encrypted during transit. Since they never pass through a central server, no one else can read them." 
          />
          <FeatureCard 
            icon={<Zap className="w-8 h-8" />} 
            title="Lightning Fast" 
            desc="Data takes the absolute shortest path. If both devices are on the same WiFi network, files transfer at local network speeds." 
          />
        </div>
      </motion.div>
    </div>
  );
};

const SenderView = ({ files, onCancel}: { files: File[]; onCancel: () => void }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('initializing'); 
  const [progress, setProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [fileProgress, setFileProgress] = useState({ current: 0, total: files.length });
  
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const shareUrl = peerId ? `${window.location.origin}${window.location.pathname}#/receive/${peerId}` : '';

  useEffect(() => {
    // GENERATE A 6-DIGIT RANDOM NUMBER
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    const peer = new Peer(id);
    peerRef.current = peer;

    peer.on('open', (id) => { setPeerId(id); setStatus('waiting'); });
    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      let currentIndex = 0;

      const sendCurrentFileMetadata = () => {
        if (currentIndex >= files.length) {
          setStatus('complete');
          conn.send({ type: 'all_done' }); 
          return;
        }
        const file = files[currentIndex];
        setFileProgress({ current: currentIndex + 1, total: files.length });
        conn.send({ type: 'metadata', name: file.name, size: file.size, mime: file.type || 'application/octet-stream' });
      };
      
      conn.on('open', () => sendCurrentFileMetadata());

      const CHUNK_SIZE = 128 * 1024; 
      const sendNextChunk = (file: File, offset: number) => {
        if (offset >= file.size) { conn.send({ type: 'eof' }); return; }
        if (conn.dataChannel && conn.dataChannel.bufferedAmount > 1024 * 1024 * 8) {
          setTimeout(() => sendNextChunk(file, offset), 50); return;
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            conn.send({ type: 'chunk', data: e.target.result });
            const newOffset = offset + CHUNK_SIZE;
            setProgress(Math.min(100, (newOffset / file.size) * 100));
            setTimeout(() => sendNextChunk(file, newOffset), 0); 
          }
        };
        reader.readAsArrayBuffer(slice);
      };

      conn.on('data', (data: any) => {
        if (data.type === 'ready') {
          setStatus('transferring'); sendNextChunk(files[currentIndex], 0); 
        } else if (data.type === 'done') {
          currentIndex++; sendCurrentFileMetadata();
        }
      });
      conn.on('close', () => { if (currentIndex < files.length) setStatus('error'); });
    });
    peer.on('error', (err) => { console.error(err); setStatus('error'); });
    return () => peer.destroy();
  }, [files]);

  const handleCopy = () => {
    copyToClipboard(shareUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const currentFile = files[fileProgress.current - 1] || files[0];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="w-full max-w-[500px] mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 overflow-hidden">
      <div className={`p-4 text-center text-white font-bold flex items-center justify-center gap-2 ${ status === 'waiting' ? 'bg-[#C68E17]' : status === 'transferring' ? 'bg-blue-500' : status === 'complete' ? 'bg-green-500' : 'bg-red-500' }`}>
        {status === 'initializing' && <><Loader2 className="animate-spin" /> Generating Secure Link...</>}
        {status === 'waiting' && <><div className="w-3 h-3 bg-white rounded-full animate-pulse" /> Ready to Share</>}
        {status === 'transferring' && <><Loader2 className="animate-spin" /> Sending File {fileProgress.current} of {fileProgress.total}...</>}
        {status === 'complete' && <><CheckCircle2 /> All Transfers Complete!</>}
        {status === 'error' && <><X /> Connection Lost</>}
      </div>

      <div className="p-8 flex flex-col items-center">
        <div className="flex items-center gap-3 w-full bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 border border-[#7B3F00]/20">
          <FileBox className="text-[#7B3F00] w-8 h-8 flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="font-bold text-[#3C1F00] truncate">{currentFile.name}</p>
            <p className="text-sm text-[#7B3F00]">{files.length > 1 ? `File ${fileProgress.current} of ${files.length} • ` : ''}{formatBytes(currentFile.size)}</p>
          </div>
        </div>

        {status === 'waiting' && shareUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
            
            {/* 👇 BOTH QR CODE & 6-DIGIT CODE DISPLAY 👇 */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full mb-6">
                <div className="bg-white p-3 rounded-2xl border-4 border-[#C68E17] shadow-lg shrink-0 hover:scale-105 transition-transform">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}&color=3C1F00`} alt="QR Code" className="w-[120px] h-[120px]" />
                </div>

                <div className="bg-[#FFFDD0] border-2 border-[#C68E17] rounded-2xl w-full h-full p-4 text-center shadow-inner relative overflow-hidden flex flex-col justify-center min-h-[148px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C68E17] to-[#7B3F00]"></div>
                  <p className="text-[#7B3F00] font-bold mb-1 uppercase tracking-wider text-[10px]">Share Code</p>
                  <div className="text-4xl sm:text-3xl md:text-4xl font-black text-[#3C1F00] tracking-[0.1em] drop-shadow-sm">{peerId}</div>
                  <p className="text-[#7B3F00]/70 text-[10px] mt-2 font-medium">Scan QR or enter code</p>
                </div>
            </div>
            {/* 👆 END DISPLAY 👆 */}
            
            <div className="w-full flex gap-3 mb-2">
              <button onClick={handleCopy} className="flex-1 bg-white border-2 border-[#7B3F00]/20 hover:border-[#7B3F00] hover:bg-[#FFFDD0]/50 text-[#7B3F00] p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm">
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied Link" : "Copy Link"}
              </button>
            </div>
          </motion.div>
        )}

        {status === 'transferring' && <ProgressBar progress={progress} statusText={`Sending ${currentFile.name}...`} />}
        {status === 'complete' && (
          <div className="text-center w-full py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <p className="font-bold text-[#3C1F00] text-xl">Successfully Sent {files.length} File(s)!</p>
          </div>
        )}

        {(status === 'error' || status === 'complete') && (
          <button onClick={onCancel} className="mt-6 w-full py-3 font-bold bg-[#FFFDD0] text-[#7B3F00] border border-[#7B3F00]/20 hover:bg-[#C68E17] hover:text-white rounded-xl transition-all">Share More Files</button>
        )}
        {status === 'waiting' && (
          <button onClick={onCancel} className="mt-4 text-sm text-gray-500 hover:text-red-500 font-semibold underline-offset-2 hover:underline">Cancel Transfer</button>
        )}
      </div>
    </motion.div>
  );
};

const ReceiverView = ({ senderId }: { senderId: string }) => {
  const [status, setStatus] = useState<string>('connecting'); 
  const [progress, setProgress] = useState<number>(0);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    let activeUrls: string[] = []; 
    const peer = new Peer();

    peer.on('open', () => {
      const conn = peer.connect(senderId, { reliable: true });
      let chunks: Blob[] = []; let receivedSize = 0; let fileMeta: any = null;

      conn.on('open', () => setStatus('connecting'));
      conn.on('data', (data: any) => {
        if (data.type === 'metadata') {
          fileMeta = data; setMetadata(data); chunks = []; receivedSize = 0; setProgress(0); setStatus('receiving'); conn.send({ type: 'ready' }); 
        } 
        else if (data.type === 'chunk') {
          chunks.push(new Blob([data.data])); receivedSize += data.data.byteLength;
          if (fileMeta) setProgress((receivedSize / fileMeta.size) * 100);
        } 
        else if (data.type === 'eof') {
          const finalBlob = new Blob(chunks, { type: fileMeta.mime });
          const url = URL.createObjectURL(finalBlob);
          activeUrls.push(url); 
          
          const a = document.createElement('a');
          a.href = url; a.download = fileMeta.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          conn.send({ type: 'done' });
        }
        else if (data.type === 'all_done') { setStatus('complete'); }
      });
      conn.on('close', () => { if (status !== 'complete') setStatus('error'); });
    });
    peer.on('error', (err) => { console.error(err); setStatus('error'); });
    return () => { activeUrls.forEach(url => URL.revokeObjectURL(url)); peer.destroy(); };
  }, [senderId]); 

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7B3F00]/10 overflow-hidden">
      <div className={`p-4 text-center text-white font-bold flex items-center justify-center gap-2 ${ status === 'connecting' ? 'bg-[#C68E17]' : status === 'receiving' ? 'bg-blue-500' : status === 'complete' ? 'bg-green-500' : 'bg-red-500' }`}>
        {status === 'connecting' && <><Loader2 className="animate-spin" /> Connecting to Sender...</>}
        {status === 'receiving' && <><Download className="animate-bounce" /> Receiving File...</>}
        {status === 'complete' && <><CheckCircle2 /> All Files Downloaded!</>}
        {status === 'error' && <><X /> Link Expired or Broken</>}
      </div>

      <div className="p-8 flex flex-col items-center">
        {metadata && status !== 'complete' && (
          <div className="flex items-center gap-3 w-full bg-[#FFFDD0]/50 p-4 rounded-xl mb-6 border border-[#7B3F00]/20 shadow-sm">
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

        {status === 'receiving' && <ProgressBar progress={progress} statusText={`Downloading ${metadata?.name}...`} />}

        {status === 'complete' && (
          <div className="text-center w-full py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <p className="font-bold text-[#3C1F00] mb-2 text-xl">All Done!</p>
            <p className="text-sm text-gray-500 mb-6 font-medium">Files have been saved to your device.</p>
            <button onClick={() => window.location.hash = ''} className="bg-[#7B3F00] hover:bg-[#3C1F00] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">
              Go to Homepage
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center w-full py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-[#3C1F00] mb-2 text-xl">Transfer Failed</p>
            <p className="text-sm text-gray-500 mb-6 font-medium">The sender might have closed their tab, or the link is invalid.</p>
            <button onClick={() => window.location.hash = ''} className="bg-[#7B3F00] hover:bg-[#3C1F00] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">
              Go to Homepage
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [route, setRoute] = useState<string>('home'); 
  const [filesToShare, setFilesToShare] = useState<File[]>([]);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/receive/')) {
        const id = hash.replace('#/receive/', '');
        setReceiverId(id); setRoute('receive');
      } else if (filesToShare.length > 0) {
        setRoute('send');
      } else {
        setRoute('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [filesToShare]);

  const startSharing = (files: File[]) => { setFilesToShare(files); setRoute('send'); window.location.hash = '#/send'; };
  const cancelSharing = () => { setFilesToShare([]); setRoute('home'); window.location.hash = ''; };

  return (
    <div className="min-h-screen bg-[#FFFDD0] text-[#3C1F00] font-sans selection:bg-[#C68E17] selection:text-white flex flex-col relative overflow-x-hidden">
      <BackgroundShapes />
      <ChocolateHeader />

      <header className="fixed top-0 left-0 w-full p-4 sm:p-6 flex items-center justify-between z-40 bg-gradient-to-b from-[#FFFDD0] to-transparent">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.hash = ''}>
          <div className="w-10 h-10 bg-[#3C1F00] rounded-xl flex items-center justify-center shadow-lg rotate-3">
            <ChocolateIcon className="text-[#FFFDD0] w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm" style={{ color: '#3C1F00' }}>
            Choco<span style={{ color: '#7B3F00' }}>share</span>
          </h1>
        </div>

        <button 
          onClick={() => setShowReceiveModal(true)} 
          className="flex items-center gap-2 bg-[#7B3F00] hover:bg-[#3C1F00] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <QrCode className="w-5 h-5" />
          <span className="hidden sm:inline">Receive Code</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 pt-32 relative z-10 w-full">
        <AnimatePresence mode="wait">
          {route === 'home' && <HomeView key="home" onFileSelect={startSharing} />}
          {route === 'send' && filesToShare.length > 0 && (
            <div className="w-full h-[60vh] flex items-center justify-center">
              <SenderView key="send" files={filesToShare} onCancel={cancelSharing} />
            </div>
          )}
          {route === 'receive' && receiverId && (
            <div className="w-full h-[60vh] flex items-center justify-center">
               <ReceiverView key="receive" senderId={receiverId} />
            </div>
          )}
        </AnimatePresence>
      </main>

      <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
    </div>
  );
}
