import React, { useState, useRef } from 'react';
import { X, Film, Lock, Globe, HardDrive, Upload, Check, Loader2, Sparkles } from 'lucide-react';
import { Movie, UserProfile } from '../types';
import { MOVIES } from '../data/movies';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    title: string;
    privacy: 'public' | 'private';
    mediaId: string;
    allowMemberControl: boolean;
    customMedia?: {
      mediaId: string;
      title: string;
      streamUrl: string;
      durationSeconds: number;
      posterUrl?: string;
    };
  }) => void;
  currentUser: UserProfile;
  initialSelectedMovie?: Movie;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  currentUser,
  initialSelectedMovie,
}) => {
  const [sourceType, setSourceType] = useState<'catalog' | 'local'>('local');
  const [title, setTitle] = useState(`${currentUser.name}'s Watch Party`);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [selectedMovieId, setSelectedMovieId] = useState<string>(
    initialSelectedMovie?.id || MOVIES[0].id
  );
  const [allowMemberControl, setAllowMemberControl] = useState<boolean>(true);

  // Local File Host State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [localVideoDuration, setLocalVideoDuration] = useState<number>(7200);

  if (!isOpen) return null;

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedLocalFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setTitle(`Movie Night: ${cleanName}`);

    // Read duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration && !isNaN(tempVideo.duration)) {
        setLocalVideoDuration(Math.round(tempVideo.duration));
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === 'local' && selectedLocalFile) {
      setIsUploading(true);
      const localBlobUrl = URL.createObjectURL(selectedLocalFile);
      const isLargeFile = selectedLocalFile.size > 100 * 1024 * 1024; // > 100MB

      if (isLargeFile) {
        // Instant room launch for large local movie files (e.g. 2GB)
        setIsUploading(false);
        onCreateRoom({
          title: title.trim() || `Movie Night: ${selectedLocalFile.name.replace(/\.[^/.]+$/, '')}`,
          privacy,
          mediaId: `local-${Date.now()}`,
          allowMemberControl,
          customMedia: {
            mediaId: `local-${Date.now()}`,
            title: selectedLocalFile.name.replace(/\.[^/.]+$/, ''),
            streamUrl: localBlobUrl,
            durationSeconds: localVideoDuration,
            posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
          }
        });
        onClose();
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', selectedLocalFile);
        formData.append('customTitle', selectedLocalFile.name.replace(/\.[^/.]+$/, ''));
        formData.append('durationSeconds', localVideoDuration.toString());

        const res = await fetch('/api/upload-local-movie', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Bypassed upload, loading from local disk');

        const uploadData = await res.json();
        setIsUploading(false);

        onCreateRoom({
          title: title.trim() || `${currentUser.name}'s Local Movie Night`,
          privacy,
          mediaId: uploadData.mediaId,
          allowMemberControl,
          customMedia: {
            mediaId: uploadData.mediaId,
            title: uploadData.title,
            streamUrl: uploadData.streamUrl,
            durationSeconds: uploadData.durationSeconds || localVideoDuration,
            posterUrl: uploadData.posterUrl
          }
        });
        onClose();
      } catch (err) {
        setIsUploading(false);
        onCreateRoom({
          title: title.trim() || `${currentUser.name}'s Movie Night`,
          privacy,
          mediaId: `local-${Date.now()}`,
          allowMemberControl,
          customMedia: {
            mediaId: `local-${Date.now()}`,
            title: selectedLocalFile.name.replace(/\.[^/.]+$/, ''),
            streamUrl: localBlobUrl,
            durationSeconds: localVideoDuration,
            posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
          }
        });
        onClose();
      }
    } else {
      onCreateRoom({
        title: title.trim() || `${currentUser.name}'s Party`,
        privacy,
        mediaId: selectedMovieId,
        allowMemberControl,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Watch Party Room</h2>
              <p className="text-xs text-zinc-400">Host a movie night with friends using local or online movies</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Movie Source</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setSourceType('local')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  sourceType === 'local'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <HardDrive className="h-4 w-4" /> Host Downloaded Movie
              </button>
              <button
                type="button"
                onClick={() => setSourceType('catalog')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  sourceType === 'catalog'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="h-4 w-4" /> Catalog Movies
              </button>
            </div>
          </div>

          {/* Local Downloaded Video File Selection */}
          {sourceType === 'local' ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">Select Video File from your System</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center cursor-pointer hover:border-rose-500/60 hover:bg-rose-950/10 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/mkv,video/x-matroska,video/quicktime,video/avi,.mp4,.mkv,.webm,.mov,.avi"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />

                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 text-rose-400 border border-zinc-700/50">
                  <Upload className="h-5 w-5" />
                </div>

                {selectedLocalFile ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                      <Check className="h-3.5 w-3.5" /> {selectedLocalFile.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {(selectedLocalFile.size / (1024 * 1024)).toFixed(1)} MB • Ready to host
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      Click to choose movie file from computer
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      MP4, MKV, WEBM, MOV, AVI supported
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Movie Catalog Selection */
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">Select Catalog Movie</label>
              <div className="grid grid-cols-3 gap-2.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                {MOVIES.map((movie) => (
                  <button
                    type="button"
                    key={movie.id}
                    onClick={() => setSelectedMovieId(movie.id)}
                    className={`relative overflow-hidden rounded-xl border p-1 text-left transition-all ${
                      selectedMovieId === movie.id
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <img src={movie.posterUrl} alt={movie.title} className="h-16 w-full object-cover rounded-lg mb-1" />
                    <p className="text-[10px] font-bold text-white truncate px-1">{movie.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Party Title */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Watch Party Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Movie Night with Friends!"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Privacy Toggle */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Room Privacy</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  privacy === 'public'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                }`}
              >
                <Globe className="h-4 w-4 text-emerald-400" /> Public (Visible to All)
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  privacy === 'private'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                }`}
              >
                <Lock className="h-4 w-4 text-amber-400" /> Private (Invite Link Only)
              </button>
            </div>
          </div>

          {/* Playback Control Permissions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Allow Viewers to Control Playback</span>
              <span className="text-[10px] text-zinc-400 block">If disabled, only Host can play, pause, or seek</span>
            </div>
            <input
              type="checkbox"
              checked={allowMemberControl}
              onChange={(e) => setAllowMemberControl(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl border border-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (sourceType === 'local' && !selectedLocalFile)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Hosting Movie...</span>
                </>
              ) : (
                <span>Launch Watch Party 🎉</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

