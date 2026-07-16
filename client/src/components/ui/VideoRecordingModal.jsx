import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Square, Play, X, Check, Loader2 } from 'lucide-react';

export default function VideoRecordingModal({ isOpen, onClose, onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      setError(null);
      setRecordedBlob(null);
      setRecordingTime(0);
      chunksRef.current = [];
      
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
          }
          setIsInitializing(false);
        })
        .catch(err => {
          setError('Camera or microphone access denied. Please allow permissions to record.');
          setIsInitializing(false);
        });
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen, cleanup]);

  const startRecording = () => {
    if (!streamRef.current) return;
    
    setRecordedBlob(null);
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
        videoRef.current.controls = true;
        videoRef.current.muted = false;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(200);
    setIsRecording(true);
    
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.controls = false;
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
    }
  };

  const handleConfirm = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      onComplete(file);
      onClose();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Live Video Recording
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="relative aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-inner mb-6">
              {isInitializing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>Accessing camera...</p>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 px-6 text-center">
                  <p>{error}</p>
                </div>
              ) : null}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${(isInitializing || error) ? 'hidden' : 'block'}`}
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-sm font-medium tabular-nums">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {error || isInitializing ? null : !recordedBlob ? (
                isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <Square className="w-5 h-5" /> Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Play className="w-5 h-5" /> Start Recording
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Retake Video
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Check className="w-5 h-5" /> Use Recording
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
