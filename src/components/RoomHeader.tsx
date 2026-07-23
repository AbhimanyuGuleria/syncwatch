import React, { useState } from 'react';
import { 
  Copy, Check, Share2, Shield, Users, LogOut, Settings, 
  Sparkles, Lock, Globe, Film, HardDrive
} from 'lucide-react';
import { WatchRoom } from '../types';

interface RoomHeaderProps {
  room: WatchRoom;
  isHost: boolean;
  onLeaveRoom: () => void;
  onToggleMemberControl: () => void;
  onOpenLocalHostModal?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  isHost,
  onLeaveRoom,
  onToggleMemberControl,
  onOpenLocalHostModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-md">
      {/* Left Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 text-rose-400 border border-rose-500/30">
          <Film className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {room.title}
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              {room.privacy === 'public' ? <Globe className="h-3 w-3 text-emerald-400" /> : <Lock className="h-3 w-3 text-amber-400" />}
              {room.privacy.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
            <span>Host: <strong className="text-zinc-200">{room.hostName}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Users className="h-3.5 w-3.5" />
              {room.members.length} Watching
            </span>
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Copy Invite Code */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono font-semibold text-rose-400 hover:border-zinc-700 transition-colors"
          title="Room Invite Code"
        >
          {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>CODE: {room.code}</span>
        </button>

        {/* Share Invite Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Invite Friends</span>
            </>
          )}
        </button>

        {/* Host Local Movie Button */}
        {onOpenLocalHostModal && (
          <button
            onClick={onOpenLocalHostModal}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-gradient-to-r from-rose-600/30 to-red-600/30 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:border-rose-500 hover:bg-rose-600/40 transition-colors shadow-sm"
            title="Host a downloaded video file from your computer"
          >
            <HardDrive className="h-3.5 w-3.5 text-rose-400" />
            <span>Host Local Movie</span>
          </button>
        )}

        {/* Host Control Settings Toggle */}
        {isHost && (
          <button
            onClick={onToggleMemberControl}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              room.allowMemberControl
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
            title="Toggle playback permissions for viewers"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{room.allowMemberControl ? 'Anyone Can Control' : 'Host Control Only'}</span>
          </button>
        )}

        {/* Leave Room */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};
