import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VideoPlayer } from './components/VideoPlayer';
import { RoomHeader } from './components/RoomHeader';
import { ChatPanel } from './components/ChatPanel';
import { BrowseView } from './components/BrowseView';
import { PublicRoomsView } from './components/PublicRoomsView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinByCodeModal } from './components/JoinByCodeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LocalMovieHostModal } from './components/LocalMovieHostModal';
import { getSocket } from './lib/socket';
import { MOVIES } from './data/movies';
import { 
  WatchRoom, UserProfile, ChatMessage, RoomMember, QueueItem, 
  ReactionEvent, Movie, PlaybackState 
} from './types';

export default function App() {
  // Current User State
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: `usr-${Math.random().toString(36).substring(2, 7)}`,
    name: 'CineFan',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    watchedCount: 12,
    favoriteGenre: 'Sci-Fi'
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<'browse' | 'rooms' | 'room'>('browse');

  // Active Watch Room state
  const [currentRoom, setCurrentRoom] = useState<WatchRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([]);
  const [userRole, setUserRole] = useState<'host' | 'co-host' | 'viewer'>('viewer');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLocalHostModalOpen, setIsLocalHostModalOpen] = useState(false);
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<Movie | undefined>(undefined);

  // Initialize socket listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('room:initial-state', ({ room, messages: initMsgs, userRole: role }) => {
      setCurrentRoom(room);
      setMessages(initMsgs || []);
      setMembers(room.members || []);
      setQueue(room.queue || []);
      setUserRole(role || 'viewer');
      setActiveTab('room');
    });

    socket.on('room:member-joined', ({ member, activeViewerCount }) => {
      setMembers(prev => {
        if (!prev.some(m => m.id === member.id)) {
          return [...prev, member];
        }
        return prev;
      });
      setCurrentRoom(prev => prev ? { ...prev, activeViewerCount } : null);
    });

    socket.on('room:member-left', ({ userId, activeViewerCount }) => {
      setMembers(prev => prev.filter(m => m.id !== userId));
      setCurrentRoom(prev => prev ? { ...prev, activeViewerCount } : null);
    });

    socket.on('playback:sync-state', (newPlaybackState: PlaybackState) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playbackState: newPlaybackState
        };
      });
    });

    socket.on('chat:received', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('reaction:received', (event: ReactionEvent) => {
      setReactionEvents(prev => [...prev, event]);
    });

    socket.on('queue:updated', (updatedQueue: QueueItem[]) => {
      setQueue(updatedQueue);
    });

    socket.on('room:members-updated', (updatedMembers: RoomMember[]) => {
      setMembers(updatedMembers);
    });

    // Check URL query parameters for auto-join
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');
    if (urlRoomId) {
      joinRoom(urlRoomId);
    }

    return () => {
      socket.off('room:initial-state');
      socket.off('room:member-joined');
      socket.off('room:member-left');
      socket.off('playback:sync-state');
      socket.off('chat:received');
      socket.off('reaction:received');
      socket.off('queue:updated');
      socket.off('room:members-updated');
    };
  }, [currentUser]);

  // Join Room Function
  const joinRoom = (roomId: string) => {
    const socket = getSocket();
    socket.emit('room:join', {
      roomId,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    });
  };

  // Create Room Function
  const handleCreateRoom = async (roomData: {
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
  }) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomData,
          hostId: currentUser.id,
          hostName: currentUser.name,
          hostAvatar: currentUser.avatar
        })
      });

      const newRoom = await res.json();
      joinRoom(newRoom.id);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  // Join by Code
  const handleJoinByCode = async (code: string) => {
    try {
      const res = await fetch('/api/rooms');
      const publicRooms: WatchRoom[] = await res.json();
      const match = publicRooms.find(r => r.code.toUpperCase() === code.toUpperCase());

      if (match) {
        joinRoom(match.id);
      } else {
        alert(`Room with code "${code}" not found. Trying default lounge...`);
        joinRoom('cinema-lounge');
      }
    } catch (err) {
      console.error('Failed to join by code:', err);
    }
  };

  // Playback Control Socket Emitters
  const handlePlay = useCallback((positionMs: number) => {
    if (!currentRoom) return;
    getSocket().emit('playback:play', { roomId: currentRoom.id, positionMs });
  }, [currentRoom]);

  const handlePause = useCallback((positionMs: number) => {
    if (!currentRoom) return;
    getSocket().emit('playback:pause', { roomId: currentRoom.id, positionMs });
  }, [currentRoom]);

  const handleSeek = useCallback((positionMs: number) => {
    if (!currentRoom) return;
    getSocket().emit('playback:seek', { roomId: currentRoom.id, positionMs });
  }, [currentRoom]);

  const handleNextMedia = useCallback(() => {
    if (!currentRoom) return;
    if (queue.length > 0) {
      const nextItem = queue[0];
      getSocket().emit('playback:media-change', {
        roomId: currentRoom.id,
        mediaId: nextItem.mediaId,
        streamUrl: nextItem.streamUrl,
        title: nextItem.title,
        durationSeconds: nextItem.durationSeconds,
        posterUrl: nextItem.posterUrl
      });
      getSocket().emit('queue:remove', { roomId: currentRoom.id, queueItemId: nextItem.id });
    }
  }, [currentRoom, queue]);

  const handleSendMessage = useCallback((content: string) => {
    if (!currentRoom) return;
    getSocket().emit('chat:send', { roomId: currentRoom.id, content });
  }, [currentRoom]);

  const handleSendReaction = useCallback((emoji: string) => {
    if (!currentRoom) return;
    getSocket().emit('reaction:send', { roomId: currentRoom.id, emoji });
  }, [currentRoom]);

  const handleAddToQueue = useCallback((item: QueueItem) => {
    if (!currentRoom) return;
    getSocket().emit('queue:add', { roomId: currentRoom.id, item });
  }, [currentRoom]);

  const handleRemoveFromQueue = useCallback((id: string) => {
    if (!currentRoom) return;
    getSocket().emit('queue:remove', { roomId: currentRoom.id, queueItemId: id });
  }, [currentRoom]);

  const handleSelectMedia = useCallback((movie: Movie) => {
    if (!currentRoom) return;
    getSocket().emit('playback:media-change', {
      roomId: currentRoom.id,
      mediaId: movie.id,
      streamUrl: movie.streamUrl,
      title: movie.title,
      durationSeconds: movie.durationSeconds,
      posterUrl: movie.posterUrl
    });
  }, [currentRoom]);

  const handleToggleMediaCall = useCallback((isMuted: boolean, cameraOn: boolean) => {
    if (!currentRoom) return;
    getSocket().emit('webrtc:media-toggle', { roomId: currentRoom.id, isMuted, cameraOn });
  }, [currentRoom]);

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setActiveTab('browse');
  };

  const isHost = userRole === 'host' || (currentRoom ? currentRoom.hostId === currentUser.id : false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => {
          setSelectedMovieForModal(undefined);
          setIsCreateModalOpen(true);
        }}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        currentUser={currentUser}
        currentRoomTitle={currentRoom?.title}
        onBackToRoom={() => setActiveTab('room')}
        isInRoom={!!currentRoom}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Active Sync Watch Room */}
        {activeTab === 'room' && currentRoom && (
          <div className="space-y-6 animate-fade-in">
            {/* Room Header */}
            <RoomHeader
              room={currentRoom}
              isHost={isHost}
              onLeaveRoom={handleLeaveRoom}
              onToggleMemberControl={() => {
                // Toggle member control setting
              }}
              onOpenLocalHostModal={() => setIsLocalHostModalOpen(true)}
            />

            {/* Split Screen Layout: Left Video Player, Right Chat & Controls Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column (2 cols): Video Player */}
              <div className="lg:col-span-2 space-y-4">
                <VideoPlayer
                  playbackState={currentRoom.playbackState}
                  isHost={isHost}
                  allowControl={currentRoom.allowMemberControl}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onNextMedia={queue.length > 0 ? handleNextMedia : undefined}
                  reactionEvents={reactionEvents}
                  subtitles={MOVIES.find(m => m.id === currentRoom.playbackState.mediaId)?.subtitles}
                />

                {/* Now Playing Media Details Bar */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Now Playing</span>
                    <h2 className="text-base font-bold text-white mt-0.5">{currentRoom.playbackState.mediaTitle}</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {MOVIES.find(m => m.id === currentRoom.playbackState.mediaId)?.description || 'Streamed live in SyncWatch Room'}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsLocalHostModalOpen(true)}
                    className="flex-none rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    Host / Change Movie 🎬
                  </button>
                </div>
              </div>

              {/* Right Column (1 col): Chat, Viewers, Queue, CineBot */}
              <div className="h-[520px] lg:h-[620px]">
                <ChatPanel
                  roomId={currentRoom.id}
                  messages={messages}
                  members={members}
                  queue={queue}
                  currentUserId={currentUser.id}
                  movieTitle={currentRoom.playbackState.mediaTitle}
                  currentPositionMs={currentRoom.playbackState.positionMs}
                  onSendMessage={handleSendMessage}
                  onSendReaction={handleSendReaction}
                  onAddToQueue={handleAddToQueue}
                  onRemoveFromQueue={handleRemoveFromQueue}
                  onSelectMedia={handleSelectMedia}
                  onToggleMediaCall={handleToggleMediaCall}
                />
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: Movie Catalog / Browse */}
        {activeTab === 'browse' && (
          <BrowseView
            onStartWatchParty={(movie) => {
              setSelectedMovieForModal(movie);
              setIsCreateModalOpen(true);
            }}
            onOpenCreateModal={() => {
              setSelectedMovieForModal(undefined);
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {/* VIEW 3: Public Live Rooms */}
        {activeTab === 'rooms' && (
          <PublicRoomsView
            onJoinRoom={(roomId) => joinRoom(roomId)}
            onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
          />
        )}

      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        currentUser={currentUser}
        initialSelectedMovie={selectedMovieForModal}
      />

      <JoinByCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onJoinByCode={handleJoinByCode}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => setCurrentUser(prev => ({ ...prev, ...updated }))}
      />

      <LocalMovieHostModal
        isOpen={isLocalHostModalOpen}
        onClose={() => setIsLocalHostModalOpen(false)}
        onSelectLocalMovie={(movieData) => {
          if (currentRoom) {
            getSocket().emit('playback:media-change', {
              roomId: currentRoom.id,
              mediaId: movieData.mediaId,
              streamUrl: movieData.streamUrl,
              title: movieData.title,
              durationSeconds: movieData.durationSeconds,
              posterUrl: movieData.posterUrl
            });
          }
        }}
      />

    </div>
  );
}
