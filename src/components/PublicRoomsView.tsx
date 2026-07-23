import React, { useEffect, useState } from 'react';
import { Users, Tv, Play, Lock, Globe, RefreshCw, Key } from 'lucide-react';
import { WatchRoom } from '../types';

interface PublicRoomsViewProps {
  onJoinRoom: (roomId: string) => void;
  onOpenJoinCodeModal: () => void;
}

export const PublicRoomsView: React.FC<PublicRoomsViewProps> = ({
  onJoinRoom,
  onOpenJoinCodeModal,
}) => {
  const [rooms, setRooms] = useState<WatchRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch public rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-2">
            <Tv className="h-6 w-6 text-rose-500" />
            Live Sync Watch Parties
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Join ongoing public rooms and watch movies together with people around the world
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRooms}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={onOpenJoinCodeModal}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
          >
            <Key className="h-3.5 w-3.5" />
            Join with Code
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <RefreshCw className="h-8 w-8 animate-spin text-rose-500 mb-3" />
          <p className="text-xs font-semibold">Loading live rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-3xl p-8 bg-zinc-950/40">
          <Tv className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Active Public Rooms Right Now</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">Be the first to host a watch party and invite your friends!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 transition-all hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-950/20"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={room.hostAvatar}
                    alt={room.hostName}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-rose-500/30"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Host: {room.hostName}</p>
                  </div>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <Users className="h-3 w-3" />
                  {room.activeViewerCount} Watching
                </span>
              </div>

              {/* Media Info */}
              <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Now Streaming:</span>
                  <span className="font-bold text-rose-300 truncate max-w-[150px]">
                    {room.playbackState.mediaTitle}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onJoinRoom(room.id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Join Watch Party</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
