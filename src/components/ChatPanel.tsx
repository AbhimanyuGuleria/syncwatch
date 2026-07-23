import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, Users, ListVideo, Sparkles, 
  Mic, MicOff, Camera, CameraOff, Plus, Trash2, Crown, 
  Flame, Heart, Laugh, Smile, ThumbsUp, Popcorn, Bot, User, Check
} from 'lucide-react';
import { ChatMessage, RoomMember, QueueItem, Movie } from '../types';
import { MOVIES } from '../data/movies';

interface ChatPanelProps {
  roomId: string;
  messages: ChatMessage[];
  members: RoomMember[];
  queue: QueueItem[];
  currentUserId: string;
  movieTitle: string;
  currentPositionMs: number;
  onSendMessage: (content: string) => void;
  onSendReaction: (emoji: string) => void;
  onAddToQueue: (item: QueueItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onSelectMedia: (movie: Movie) => void;
  onToggleMediaCall: (isMuted: boolean, cameraOn: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  roomId,
  messages,
  members,
  queue,
  currentUserId,
  movieTitle,
  currentPositionMs,
  onSendMessage,
  onSendReaction,
  onAddToQueue,
  onRemoveFromQueue,
  onSelectMedia,
  onToggleMediaCall,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'call' | 'queue' | 'ai'>('chat');
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Voice/Video Call state
  const [isMuted, setIsMuted] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);

  // Queue Custom URL input
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // AI Assistant State
  const [aiPrompts, setAiPrompts] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: `🍿 Hey there! I'm **CineBot**, your AI Movie Companion for **${movieTitle}**! Ask me for spoiler-free plot recaps, easter eggs, trivia, or commentary!`
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, aiPrompts, activeTab]);

  // Handle Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  // Toggle Mic / Camera
  const handleToggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    onToggleMediaCall(nextMuted, cameraOn);
  };

  const handleToggleCamera = () => {
    const nextCamera = !cameraOn;
    setCameraOn(nextCamera);
    onToggleMediaCall(isMuted, nextCamera);
  };

  // Add Custom Video Stream to Queue
  const handleAddCustomToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customTitle.trim()) return;

    const newItem: QueueItem = {
      id: `queue-${Date.now()}`,
      mediaId: `custom-${Date.now()}`,
      title: customTitle.trim(),
      streamUrl: customUrl.trim(),
      durationSeconds: 600,
      addedBy: currentUserId,
      addedByName: members.find(m => m.id === currentUserId)?.name || 'Member'
    };

    onAddToQueue(newItem);
    setCustomUrl('');
    setCustomTitle('');
    setShowAddCustomModal(false);
  };

  // Ask AI Assistant
  const handleAskAi = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userPrompt = promptText.trim();
    setAiPrompts(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/movie-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          movieTitle,
          currentPositionMs
        })
      });
      const data = await res.json();
      setAiPrompts(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setAiPrompts(prev => [...prev, { sender: 'bot', text: '🎬 Movie magic is happening! Try asking again in a moment.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const EMOJI_REACTIONS = ['🔥', '😂', '😱', '❤️', '🍿', '👏', '🎉', '😮'];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md overflow-hidden shadow-2xl">
      
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-zinc-800/80 bg-zinc-900/50 p-1.5">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'chat'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('call')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'call'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Viewers ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListVideo className="h-3.5 w-3.5" />
          <span>Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'ai'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
          <span>CineBot</span>
        </button>
      </div>

      {/* Tab Content 1: Live Chat */}
      {activeTab === 'chat' && (
        <div className="flex flex-1 flex-col justify-between overflow-hidden p-3">
          {/* Message List */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="my-2 text-center">
                    <span className="inline-block rounded-full bg-zinc-900/90 border border-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-400">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const isMe = msg.userId === currentUserId;

              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={msg.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={msg.userName}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700 mt-0.5"
                  />
                  <div className={`max-w-[80%] rounded-2xl p-2.5 ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold tracking-tight text-zinc-300">
                        {msg.userName}
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Reaction Bar */}
          <div className="pt-2 pb-2 border-t border-zinc-800/60 mt-2">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendReaction(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/90 border border-zinc-800 text-base hover:bg-rose-500/20 hover:border-rose-500/40 hover:scale-110 active:scale-90 transition-all"
                  title={`Send floating reaction ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send a message to room..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 active:scale-95 transition-all shadow-md shadow-rose-600/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab Content 2: Viewers & Call */}
      {activeTab === 'call' && (
        <div className="flex flex-1 flex-col justify-between p-3 overflow-hidden">
          {/* Member List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-700"
                    />
                    {member.cameraOn && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-zinc-950"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{member.name}</span>
                      {member.role === 'host' && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                          <Crown className="h-2.5 w-2.5" /> Host
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {member.isMuted ? 'Muted' : 'Speaking'}
                    </span>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${member.isMuted ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {member.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 animate-pulse" />}
                  </div>
                  <div className={`p-1.5 rounded-lg ${member.cameraOn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {member.cameraOn ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Voice & Video Controls Bar */}
          <div className="mt-3 border-t border-zinc-800/80 pt-3 flex items-center justify-around bg-zinc-900/80 rounded-xl p-2.5">
            <button
              onClick={handleToggleMic}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isMuted
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{isMuted ? 'Unmute' : 'Muted'}</span>
            </button>

            <button
              onClick={handleToggleCamera}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                !cameraOn
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              }`}
            >
              {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              <span>{cameraOn ? 'Camera On' : 'Camera Off'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 3: Playlist Queue */}
      {activeTab === 'queue' && (
        <div className="flex flex-1 flex-col justify-between p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-300">Up Next in Queue</span>
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add Stream
            </button>
          </div>

          {/* Queue Items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500">
                <ListVideo className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Queue is empty</p>
                <p className="text-[10px]">Add videos from catalog or custom link</p>
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-zinc-500 w-4">{idx + 1}.</span>
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[160px]">{item.title}</p>
                      <p className="text-[10px] text-zinc-400">Added by {item.addedByName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Catalog Quick Add List */}
          <div className="mt-3 border-t border-zinc-800/80 pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Quick Add From Library</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MOVIES.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMedia(m)}
                  className="flex-none rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-left hover:border-rose-500/50 transition-colors w-28"
                >
                  <img src={m.posterUrl} alt={m.title} className="h-12 w-full object-cover rounded mb-1" />
                  <p className="text-[10px] font-bold text-white truncate">{m.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: AI Movie Companion (CineBot) */}
      {activeTab === 'ai' && (
        <div className="flex flex-1 flex-col justify-between p-3 overflow-hidden">
          {/* Feed */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
            {aiPrompts.map((p, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${p.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {p.sender === 'bot' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-400 mt-1">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    p.sender === 'user'
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {p.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex items-center gap-2 text-xs text-rose-400 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" /> CineBot is analyzing scene...
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="pt-2 border-t border-zinc-800/60 mt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => handleAskAi('Give me a quick spoiler-free recap of the plot so far.')}
                className="flex-none rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-rose-500/40 hover:text-white"
              >
                📖 Plot Recap
              </button>
              <button
                onClick={() => handleAskAi('Tell me cool movie trivia and hidden easter eggs for this scene!')}
                className="flex-none rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-rose-500/40 hover:text-white"
              >
                🎬 Fun Trivia
              </button>
              <button
                onClick={() => handleAskAi('Give me a hilarious spoiler-free commentary about this movie!')}
                className="flex-none rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-rose-500/40 hover:text-white"
              >
                😂 Funny Commentary
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi(aiInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask CineBot anything about this movie..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-red-500"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal to add custom stream URL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Custom Video Stream</h3>
            <p className="text-xs text-zinc-400 mb-4">Paste any direct MP4 or HLS (.m3u8) video URL</p>

            <form onSubmit={handleAddCustomToQueue} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Stream Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk City Trailer"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Direct Stream URL (MP4 / HLS)</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Add Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
