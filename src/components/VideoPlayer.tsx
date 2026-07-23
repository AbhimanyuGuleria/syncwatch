import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  RotateCcw, RotateCw, SkipForward, Settings, Captions,
  Radio, AlertCircle, Sparkles, PictureInPicture
} from 'lucide-react';
import { PlaybackState, ReactionEvent, Subtitle } from '../types';

interface VideoPlayerProps {
  playbackState: PlaybackState;
  isHost: boolean;
  allowControl: boolean;
  onPlay: (positionMs: number) => void;
  onPause: (positionMs: number) => void;
  onSeek: (positionMs: number) => void;
  onNextMedia?: () => void;
  reactionEvents: ReactionEvent[];
  subtitles?: Subtitle[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playbackState,
  isHost,
  allowControl,
  onPlay,
  onPause,
  onSeek,
  onNextMedia,
  reactionEvents,
  subtitles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(playbackState.status === 'playing');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(playbackState.mediaDurationSeconds || 0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'catching_up' | 'paused'>('synced');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [activeReactions, setActiveReactions] = useState<ReactionEvent[]>([]);

  // Show/Hide Controls Auto Timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  // Add new reaction events to active floating reaction list
  useEffect(() => {
    if (reactionEvents.length > 0) {
      const latest = reactionEvents[reactionEvents.length - 1];
      setActiveReactions(prev => [...prev.slice(-15), latest]);

      const timer = setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== latest.id));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reactionEvents]);

  // Master Synchronized Clock Effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncInterval = setInterval(() => {
      if (!video) return;

      const now = Date.now();
      const elapsedSec = playbackState.status === 'playing' ? (now - playbackState.serverTimestamp) / 1000 : 0;
      const expectedTimeSec = (playbackState.positionMs / 1000) + (elapsedSec * (playbackState.playbackRate || 1.0));

      if (playbackState.status === 'paused') {
        if (!video.paused) {
          video.pause();
        }
        if (Math.abs(video.currentTime - (playbackState.positionMs / 1000)) > 0.2) {
          video.currentTime = playbackState.positionMs / 1000;
        }
        setIsPlaying(false);
        setSyncStatus('paused');
        return;
      }

      // If playbackState is 'playing'
      if (playbackState.status === 'playing') {
        setIsPlaying(true);
        if (video.paused) {
          video.play().catch(e => console.log('Autoplay prevented:', e));
        }

        const drift = video.currentTime - expectedTimeSec;
        const absDrift = Math.abs(drift);

        if (absDrift > 0.4) {
          // Hard seek if drift is significant (> 400ms)
          video.currentTime = expectedTimeSec;
          setSyncStatus('catching_up');
        } else if (absDrift > 0.05) {
          // Micro adjust playbackRate to catch up smoothly
          if (drift < 0) {
            video.playbackRate = 1.05; // video is slightly behind
          } else {
            video.playbackRate = 0.95; // video is slightly ahead
          }
          setSyncStatus('catching_up');
        } else {
          video.playbackRate = playbackState.playbackRate || 1.0;
          setSyncStatus('synced');
        }
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, [playbackState]);

  // Handle Play/Pause Toggle by User
  const togglePlayPause = () => {
    if (!allowControl && !isHost) return;

    const video = videoRef.current;
    if (!video) return;

    const currentMs = Math.floor(video.currentTime * 1000);
    if (isPlaying) {
      onPause(currentMs);
    } else {
      onPlay(currentMs);
    }
  };

  // Handle Seek Slider
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowControl && !isHost) return;

    const newTimeSec = parseFloat(e.target.value);
    setCurrentTime(newTimeSec);
    if (videoRef.current) {
      videoRef.current.currentTime = newTimeSec;
    }
    onSeek(Math.floor(newTimeSec * 1000));
  };

  // Skip 10 seconds
  const handleSkip = (seconds: number) => {
    if (!allowControl && !isHost) return;

    const video = videoRef.current;
    if (!video) return;

    const newTimeSec = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTimeSec;
    onSeek(Math.floor(newTimeSec * 1000));
  };

  // Volume & Mute
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.log(err));
      setIsFullscreen(false);
    }
  };

  // PiP
  const togglePiP = () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(e => console.log(e));
      } else {
        videoRef.current.requestPictureInPicture().catch(e => console.log(e));
      }
    }
  };

  // Format Time Helper
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    const displayM = m % 60;

    if (h > 0) {
      return `${h}:${displayM < 10 ? '0' : ''}${displayM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${displayM < 10 ? '0' : ''}${displayM}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-zinc-800 select-none group"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={playbackState.mediaStreamUrl}
        poster={playbackState.mediaPosterUrl}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onClick={togglePlayPause}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
      >
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            src={sub.src}
            srcLang={sub.srclang}
            label={sub.label}
            default={selectedSubtitle === sub.srclang}
          />
        ))}
      </video>

      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {activeReactions.map((react) => (
          <div
            key={react.id}
            style={{
              left: `${react.xRatio * 85 + 5}%`,
              bottom: '15%',
            }}
            className="absolute animate-float-up flex flex-col items-center"
          >
            <span className="text-4xl filter drop-shadow-md animate-bounce">
              {react.emoji}
            </span>
            <span className="text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full mt-0.5 border border-white/10">
              {react.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Sync Status Badge (Top Left) */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-zinc-950/80 border border-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              syncStatus === 'synced' ? 'bg-emerald-400' : syncStatus === 'catching_up' ? 'bg-amber-400' : 'bg-zinc-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'catching_up' ? 'bg-amber-500' : 'bg-zinc-500'
            }`}></span>
          </span>
          <span>
            {syncStatus === 'synced' ? 'Live Synced' : syncStatus === 'catching_up' ? 'Syncing Clock...' : 'Paused'}
          </span>
        </div>

        {!allowControl && !isHost && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-md">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Host Only Control</span>
          </div>
        )}
      </div>

      {/* Movie Title Banner (Top Right) */}
      <div className="absolute top-4 right-4 z-30 hidden sm:block">
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 px-3.5 py-1.5 backdrop-blur-md text-right">
          <p className="text-xs font-semibold text-white truncate max-w-[220px]">
            {playbackState.mediaTitle}
          </p>
          <p className="text-[10px] text-zinc-400">SyncWatch Room Stream</p>
        </div>
      </div>

      {/* Center Big Play/Pause Overlay Button when Paused or Hovered */}
      {(!isPlaying || showControls) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
          <button
            onClick={togglePlayPause}
            disabled={!allowControl && !isHost}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-600/30 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 fill-white" />
            ) : (
              <Play className="h-8 w-8 fill-white ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar & Scrubber */}
        <div className="group/scrub relative mb-3 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            disabled={!allowControl && !isHost}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-rose-500 transition-all hover:h-2.5 focus:outline-none disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #f43f5e ${(currentTime / (duration || 1)) * 100}%, #27272a ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-white">
          
          {/* Left Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              disabled={!allowControl && !isHost}
              className="text-zinc-200 hover:text-white transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              disabled={!allowControl && !isHost}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Rewind 10s"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => handleSkip(10)}
              disabled={!allowControl && !isHost}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Forward 10s"
            >
              <RotateCw className="h-4.5 w-4.5" />
            </button>

            {onNextMedia && (
              <button
                onClick={onNextMedia}
                disabled={!allowControl && !isHost}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                title="Next in Queue"
              >
                <SkipForward className="h-4.5 w-4.5" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-16 cursor-pointer appearance-none rounded bg-zinc-700 accent-rose-500 opacity-80 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time Stamp */}
            <span className="text-xs font-mono font-medium text-zinc-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Group */}
          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => {
                const spd = parseFloat(e.target.value);
                setPlaybackSpeed(spd);
                if (videoRef.current) videoRef.current.playbackRate = spd;
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 hover:border-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x Normal</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
            </select>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="text-zinc-400 hover:text-white transition-colors hidden sm:block"
              title="Picture in Picture"
            >
              <PictureInPicture className="h-4.5 w-4.5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
