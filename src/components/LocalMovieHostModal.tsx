import React, { useState, useRef } from 'react';
import { X, Upload, Film, HardDrive, Play, Check, AlertCircle, Loader2, Monitor } from 'lucide-react';

interface LocalMovieHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocalMovie: (movieData: {
    title: string;
    streamUrl: string;
    mediaId: string;
    durationSeconds: number;
    posterUrl?: string;
  }) => void;
  onSelectScreenShare?: () => void;
}

export const LocalMovieHostModal: React.FC<LocalMovieHostModalProps> = ({
  isOpen,
  onClose,
  onSelectLocalMovie,
  onSelectScreenShare,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(7200);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [hostMode, setHostMode] = useState<'file' | 'url'>('file');
  const [directUrl, setDirectUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setCustomTitle(cleanName);

    // Read duration using temporary video element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration && !isNaN(tempVideo.duration)) {
        setVideoDuration(Math.round(tempVideo.duration));
      }
    };
  };

  const handleUploadAndHost = async () => {
    if (hostMode === 'url') {
      if (!directUrl.trim()) {
        setErrorMsg('Please enter a valid direct video stream URL (MP4, WEBM, etc.)');
        return;
      }
      onSelectLocalMovie({
        title: customTitle || 'Custom Video Stream',
        streamUrl: directUrl.trim(),
        mediaId: `url-${Date.now()}`,
        durationSeconds: videoDuration || 3600,
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
      });
      onClose();
      return;
    }

    if (!selectedFile) {
      setErrorMsg('Please select a local video file from your computer');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setErrorMsg(null);

    const localBlobUrl = URL.createObjectURL(selectedFile);

    // Upload to server using XHR to stream to remote friends
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customTitle', customTitle || selectedFile.name);
      formData.append('durationSeconds', videoDuration.toString());

      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload-local-movie');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      setUploadProgress(100);

      onSelectLocalMovie({
        title: data.title || customTitle || selectedFile.name,
        streamUrl: data.streamUrl || localBlobUrl,
        mediaId: data.mediaId || `local-${Date.now()}`,
        durationSeconds: data.durationSeconds || videoDuration,
        posterUrl: data.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
      });

      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.warn('Server upload fallback to local disk:', err);
      // Fallback for host local playback
      onSelectLocalMovie({
        title: customTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
        streamUrl: localBlobUrl,
        mediaId: `local-blob-${Date.now()}`,
        durationSeconds: videoDuration,
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
      });
      setIsUploading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Host Video Stream</h2>
              <p className="text-xs text-zinc-400">Host local movie files or public video stream URLs for your friends</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Host Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setHostMode('file')}
            className={`rounded-xl py-2 text-xs font-bold transition-all ${
              hostMode === 'file'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💻 Local File Upload
          </button>
          <button
            type="button"
            onClick={() => setHostMode('url')}
            className={`rounded-xl py-2 text-xs font-bold transition-all ${
              hostMode === 'url'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔗 Direct Video URL
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {hostMode === 'file' ? (
            <>
              {/* File Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center transition-all hover:border-rose-500/60 hover:bg-rose-950/10 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/mkv,video/x-matroska,video/quicktime,video/avi,.mp4,.mkv,.webm,.mov,.avi"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-rose-400 group-hover:scale-110 group-hover:bg-rose-600/20 transition-all border border-zinc-700/50">
                  <Upload className="h-7 w-7" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <Check className="h-4 w-4" /> File Selected: {selectedFile.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Uploads to server so all friends can stream it
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-200">
                      Click to select movie file from your computer
                    </p>
                    <p className="text-xs text-zinc-400">
                      Supports MP4, MKV, WEBM, MOV, AVI (up to 2GB)
                    </p>
                  </div>
                )}
              </div>

              {/* Title Override Input */}
              {selectedFile && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">Movie Title for Watch Party</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Movie Title"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">Direct Video Stream URL (.mp4, .webm)</label>
                <input
                  type="url"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">Movie Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Stream Title (e.g. My Movie Stream)"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                ⚡ Direct URLs stream instantly for all remote viewers without uploading files or relying on local machine tunnels.
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  Uploading file to server for remote streaming...
                </span>
                <span className="text-rose-400 font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Screen Share Alternative option */}
          {onSelectScreenShare && (
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  onSelectScreenShare();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-all hover:bg-zinc-900 hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Share Screen or Movie Player Window</p>
                    <p className="text-[10px] text-zinc-400">Stream your desktop video player directly in real-time</p>
                  </div>
                </div>
                <span className="text-xs text-indigo-400 font-semibold">Start Stream →</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl border border-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUploadAndHost}
            disabled={(hostMode === 'file' && !selectedFile) || (hostMode === 'url' && !directUrl.trim()) || isUploading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading Movie...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>{hostMode === 'file' ? 'Upload & Host Stream 🎉' : 'Start Video Stream 🎉'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
