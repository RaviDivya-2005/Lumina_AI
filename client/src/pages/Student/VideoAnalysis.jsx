import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Upload,
  FileVideo,
  FileAudio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Film,
  Clock,
  FileText,
  Languages,
  Copy,
  Check,
  Camera,
  StopCircle,
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import AdminLayout from '../../components/layout/AdminLayout';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import supabase from '../../utils/supabase';

const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || '/api';
const ACCEPTED_TYPES = '.mp4,.webm,.mpeg,.ogg,.mp3,.wav,.flac,.m4a';
const MAX_SIZE = 100 * 1024 * 1024;

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function VideoAnalysis() {
  const { user } = useAuthStore();
  const Layout = user?.role === 'student' ? StudentLayout : AdminLayout;
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'record'
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Webcam states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Stop camera and recording timer on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getFileIcon = (type) => {
    if (type?.startsWith('video/')) return Film;
    return FileAudio;
  };

  const validateFile = (f) => {
    if (!f) return 'No file selected';
    const allowed = [
      'video/mp4', 'video/webm', 'video/mpeg', 'video/ogg',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/flac', 'audio/m4a', 'audio/mp4', 'audio/webm',
    ];
    if (!allowed.includes(f.type) && !f.name.match(/\.(mp4|webm|mpeg|ogg|mp3|wav|flac|m4a)$/i)) {
      return 'Unsupported format. Use mp4, webm, mp3, wav, ogg, or flac.';
    }
    if (f.size > MAX_SIZE) {
      return 'File too large. Maximum size is 100MB.';
    }
    return null;
  };

  const handleFile = (f) => {
    setError(null);
    setResult(null);
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetAll();
  };

  // Webcam actions
  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Allow DOM to update and then bind stream
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Could not access your camera or microphone. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const fileObj = new File([blob], `live-recording-${Date.now()}.webm`, { type: 'video/webm' });
        setFile(fileObj);
        
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Failed to start recording. Please try again.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopCamera();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress('Uploading file...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const formData = new FormData();
      formData.append('video', file);

      setProgress('Transcribing audio with Whisper...');

      const res = await fetch(`${AI_PROXY_URL}/video/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Analysis failed');
      }

      setProgress('Analyzing content with AI...');
      setResult(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
      setProgress('');
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const text = `# Video Analysis: ${result.fileName}\n\n## Transcript\n${result.transcript}\n\n## Analysis\n${result.analysis}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    stopCamera();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setFile(null);
    setResult(null);
    setError(null);
    setProgress('');
    setRecordedUrl(null);
  };

  const FileIcon = file ? getFileIcon(file.type) : Upload;

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video & Audio Analysis</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload a file or record live using your webcam to get AI-powered transcription and content analysis
          </p>
        </motion.div>

        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 dark:border-white/10 mb-6">
                <button
                  onClick={() => handleTabChange('upload')}
                  className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                    activeTab === 'upload'
                      ? 'border-indigo-600 text-indigo-600 dark:border-white dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => handleTabChange('record')}
                  className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === 'record'
                      ? 'border-indigo-600 text-indigo-600 dark:border-white dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Record Live Video
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => inputRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                    dragOver
                      ? 'border-indigo-600 bg-indigo-50/50 dark:border-white/50 dark:bg-white/5'
                      : file
                      ? 'border-indigo-500/30 bg-indigo-50/25 dark:border-white/30 dark:bg-white/5'
                      : 'border-slate-200 hover:border-indigo-600 hover:bg-slate-50 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFile(e.target.files[0]);
                      e.target.value = '';
                    }}
                  />

                  {file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center mx-auto">
                        <FileIcon className="w-8 h-8 text-indigo-600 dark:text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-md mx-auto">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatSize(file.size)}
                          {file.type.startsWith('video/') && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Film className="w-3.5 h-3.5" /> Video
                            </span>
                          )}
                          {file.type.startsWith('audio/') && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <FileAudio className="w-3.5 h-3.5" /> Audio
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); resetAll(); }}
                          className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                        >
                          Change file
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                          disabled={analyzing}
                          className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {analyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-indigo-600 dark:text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">Drop your file here, or click to browse</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Supports MP4, WebM, MP3, WAV, OGG, FLAC, M4A (max 100MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Webcam recording interface */
                <div className="p-4">
                  {file ? (
                    <div className="space-y-4 max-w-xl mx-auto text-center">
                      <video src={recordedUrl} controls className="rounded-xl w-full border border-slate-200 dark:border-white/10 bg-black max-h-[360px]" />
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">Live Recording Ready</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatSize(file.size)}</p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => resetAll()}
                          className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                        >
                          Record Again
                        </button>
                        <button
                          onClick={() => handleAnalyze()}
                          disabled={analyzing}
                          className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {analyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                    </div>
                  ) : isCameraActive ? (
                    <div className="space-y-4 max-w-xl mx-auto">
                      <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-white/10 bg-black flex items-center justify-center">
                        <video
                           ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        {isRecording && (
                          <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            <span>Recording {formatDuration(recordingDuration)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-3">
                        {!isRecording ? (
                          <>
                            <button
                              onClick={stopCamera}
                              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                            >
                              Turn Off Camera
                            </button>
                            <button
                              onClick={startRecording}
                              className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all flex items-center gap-2"
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-white" />
                              Start Recording
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="px-6 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
                          >
                            <StopCircle className="w-4 h-4 text-red-600" />
                            Stop Recording
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-indigo-600 dark:text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">Record using your Webcam</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lively record a video and submit it for transcription and AI analysis.</p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10"
          >
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-white" />
            <span className="text-sm text-gray-800 dark:text-white font-medium">{progress}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><X className="w-4 h-4" /></button>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 dark:bg-white/10 p-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Complete</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{result.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyResult} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-indigo-600 dark:text-white" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={resetAll} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <Badge variant="info">{result.fileName.split('.').pop().toUpperCase()}</Badge>
                {result.duration && <Badge variant="default">{formatDuration(result.duration)}</Badge>}
                <Badge variant="success">{result.language === 'en' ? 'English' : result.language}</Badge>
                <Badge variant="info">{formatSize(result.fileSize)}</Badge>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-white" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transcript</h3>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {result.segments?.length > 0 ? (
                    result.segments.map((seg, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-colors">
                        <span className="flex-shrink-0 text-xs font-mono text-gray-500 dark:text-gray-400 w-12 pt-0.5">{formatDuration(seg.start)}</span>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{seg.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <FileVideo className="w-5 h-5 text-pink-600 dark:text-white" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
                </div>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const value = String(children).replace(/\n$/, '');
                        if (!inline) return <pre className="p-3 rounded-xl bg-slate-900 overflow-x-auto my-2 text-xs"><code {...props}>{value}</code></pre>;
                        return <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-gray-800 dark:bg-white/10 dark:text-white text-xs" {...props}>{children}</code>;
                      },
                      p({ children }) { return <p className="mb-3 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-200">{children}</p>; },
                      ul({ children }) { return <ul className="list-disc pl-4 mb-3 space-y-1 text-gray-700 dark:text-gray-200">{children}</ul>; },
                      ol({ children }) { return <ol className="list-decimal pl-4 mb-3 space-y-1 text-gray-700 dark:text-gray-200">{children}</ol>; },
                      h1({ children }) { return <h1 className="text-base font-bold mb-2 mt-4 text-gray-900 dark:text-white">{children}</h1>; },
                      h2({ children }) { return <h2 className="text-sm font-bold mb-2 mt-3 text-gray-900 dark:text-white">{children}</h2>; },
                      h3({ children }) { return <h3 className="text-sm font-semibold mb-1 mt-3 text-gray-900 dark:text-white">{children}</h3>; },
                      strong({ children }) { return <strong className="text-gray-900 dark:text-white font-semibold">{children}</strong>; },
                      blockquote({ children }) { return <blockquote className="border-l-2 border-slate-300 pl-3 my-2 text-gray-500 dark:border-white/30 dark:text-gray-400 italic">{children}</blockquote>; },
                    }}
                  >
                    {result.analysis}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
