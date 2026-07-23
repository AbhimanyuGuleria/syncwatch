import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { MOVIES } from './src/data/movies';
import { WatchRoom, PlaybackState, RoomMember, ChatMessage, QueueItem, ReactionEvent } from './src/types';

// Ensure upload directory exists for local movies
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `movie-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // In-memory Room & State Storage
  const rooms = new Map<string, WatchRoom>();
  const chatMessages = new Map<string, ChatMessage[]>();
  const socketUserMap = new Map<string, { roomId: string; user: RoomMember }>();

  // Helper to generate room codes
  function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Pre-seed a default public watch party room so visitors can instantly watch
  const defaultRoomId = 'cinema-lounge';
  const defaultMovie = MOVIES[0]; // Sintel
  const defaultPlaybackState: PlaybackState = {
    status: 'playing',
    positionMs: 120000, // 2 minutes in
    serverTimestamp: Date.now(),
    playbackRate: 1.0,
    mediaId: defaultMovie.id,
    mediaTitle: defaultMovie.title,
    mediaStreamUrl: defaultMovie.streamUrl,
    mediaDurationSeconds: defaultMovie.durationSeconds,
    mediaPosterUrl: defaultMovie.posterUrl,
    bufferingUsers: []
  };

  rooms.set(defaultRoomId, {
    id: defaultRoomId,
    code: 'LOUNGE',
    title: '🍿 Global SyncWatch Lounge: Sintel & Sci-Fi',
    hostId: 'system-host',
    hostName: 'SyncWatch Cinema',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    privacy: 'public',
    allowMemberControl: true,
    playbackState: defaultPlaybackState,
    members: [],
    queue: [
      {
        id: 'q-1',
        mediaId: MOVIES[1].id,
        title: MOVIES[1].title,
        streamUrl: MOVIES[1].streamUrl,
        durationSeconds: MOVIES[1].durationSeconds,
        posterUrl: MOVIES[1].posterUrl,
        addedBy: 'system',
        addedByName: 'AutoQueue'
      },
      {
        id: 'q-2',
        mediaId: MOVIES[2].id,
        title: MOVIES[2].title,
        streamUrl: MOVIES[2].streamUrl,
        durationSeconds: MOVIES[2].durationSeconds,
        posterUrl: MOVIES[2].posterUrl,
        addedBy: 'system',
        addedByName: 'AutoQueue'
      }
    ],
    createdAt: Date.now(),
    activeViewerCount: 0
  });

  chatMessages.set(defaultRoomId, [
    {
      id: 'msg-welcome-1',
      roomId: defaultRoomId,
      userId: 'system',
      userName: 'SyncWatch Bot',
      userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      content: 'Welcome to SyncWatch Lounge! Playback is synced in real time across all connected viewers.',
      type: 'system',
      timestamp: Date.now() - 300000
    }
  ]);

  // Calculate authoritative playback position
  function getAuthoritativeState(room: WatchRoom): PlaybackState {
    const state = room.playbackState;
    if (state.status === 'playing') {
      const elapsed = Date.now() - state.serverTimestamp;
      const currentMs = state.positionMs + (elapsed * state.playbackRate);
      const maxMs = state.mediaDurationSeconds * 1000;
      
      // Handle video loop or end
      if (currentMs >= maxMs && maxMs > 0) {
        // If queue has items, load next automatically
        if (room.queue.length > 0) {
          const nextItem = room.queue.shift()!;
          state.mediaId = nextItem.mediaId;
          state.mediaTitle = nextItem.title;
          state.mediaStreamUrl = nextItem.streamUrl;
          state.mediaDurationSeconds = nextItem.durationSeconds;
          state.mediaPosterUrl = nextItem.posterUrl;
          state.positionMs = 0;
          state.serverTimestamp = Date.now();
        } else {
          // Restart video
          state.positionMs = 0;
          state.serverTimestamp = Date.now();
        }
      } else {
        return {
          ...state,
          positionMs: currentMs,
          serverTimestamp: Date.now()
        };
      }
    }
    return {
      ...state,
      serverTimestamp: Date.now()
    };
  }

  // API Routes
  app.get('/api/time', (req, res) => {
    res.json({ serverTime: Date.now() });
  });

  app.get('/api/movies', (req, res) => {
    res.json(MOVIES);
  });

  // Upload local movie file from host machine
  app.post('/api/upload-local-movie', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const durationSeconds = parseInt(req.body.durationSeconds, 10) || 7200; // default 2 hrs if metadata pending
    const originalNameClean = req.file.originalname.replace(/\.[^/.]+$/, "");
    const mediaId = `local-${Date.now()}`;
    const filename = req.file.filename;
    const streamUrl = `/api/media/stream/${filename}`;

    res.json({
      mediaId,
      title: req.body.customTitle || originalNameClean,
      streamUrl,
      durationSeconds,
      filename,
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
    });
  });

  // Range-based Video Streaming Endpoint for uploaded local movies
  app.get('/api/media/stream/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Movie file not found on server');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Detect MIME type based on extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'video/mp4';
    if (ext === '.webm') mimeType = 'video/webm';
    else if (ext === '.mkv') mimeType = 'video/x-matroska';
    else if (ext === '.mov') mimeType = 'video/quicktime';
    else if (ext === '.avi') mimeType = 'video/x-msvideo';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024, fileSize - 1);

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
        return;
      }

      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.get('/api/rooms', (req, res) => {
    const publicRooms = Array.from(rooms.values())
      .filter(r => r.privacy === 'public')
      .map(r => ({
        ...r,
        playbackState: getAuthoritativeState(r),
        activeViewerCount: r.members.length
      }));
    res.json(publicRooms);
  });

  app.get('/api/rooms/:id', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
      ...room,
      playbackState: getAuthoritativeState(room),
      activeViewerCount: room.members.length
    });
  });

  app.post('/api/rooms', (req, res) => {
    const { title, hostId, hostName, hostAvatar, privacy, mediaId, allowMemberControl, customMedia } = req.body;
    let movie = MOVIES.find(m => m.id === mediaId);

    const mediaTitle = customMedia?.title || movie?.title || 'Local Host Stream';
    const mediaStreamUrl = customMedia?.streamUrl || movie?.streamUrl || '';
    const mediaDuration = customMedia?.durationSeconds || movie?.durationSeconds || 7200;
    const mediaPoster = customMedia?.posterUrl || movie?.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800';
    const finalMediaId = customMedia?.mediaId || mediaId || `media-${Date.now()}`;

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const code = generateCode();

    const newPlaybackState: PlaybackState = {
      status: 'playing',
      positionMs: 0,
      serverTimestamp: Date.now(),
      playbackRate: 1.0,
      mediaId: finalMediaId,
      mediaTitle,
      mediaStreamUrl,
      mediaDurationSeconds: mediaDuration,
      mediaPosterUrl: mediaPoster,
      bufferingUsers: []
    };

    const newRoom: WatchRoom = {
      id: roomId,
      code,
      title: title || `${hostName}'s Watch Party`,
      hostId: hostId || 'host-1',
      hostName: hostName || 'Party Host',
      hostAvatar: hostAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      privacy: privacy || 'public',
      allowMemberControl: allowMemberControl !== undefined ? allowMemberControl : true,
      playbackState: newPlaybackState,
      members: [],
      queue: [],
      createdAt: Date.now(),
      activeViewerCount: 0
    };

    rooms.set(roomId, newRoom);
    chatMessages.set(roomId, [
      {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        userName: 'SyncWatch',
        userAvatar: '',
        content: `Party room "${newRoom.title}" created! Invite code: ${code}`,
        type: 'system',
        timestamp: Date.now()
      }
    ]);

    res.json({
      ...newRoom,
      playbackState: getAuthoritativeState(newRoom)
    });
  });

  // AI Movie Assistant Route (Gemini API)
  app.post('/api/ai/movie-assistant', async (req, res) => {
    try {
      const { prompt, movieTitle, currentPositionMs, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          reply: `🍿 **CineBot Insight**: You are watching **${movieTitle || 'a movie'}**! (Note: Configure GEMINI_API_KEY in secrets to activate full Gemini AI responses). Here is a quick fact: This movie features stunning cinematography and synchronized playback for all your friends!`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const currentMin = Math.floor((currentPositionMs || 0) / 60000);
      const currentSec = Math.floor(((currentPositionMs || 0) % 60000) / 1000);
      const timeFormatted = `${currentMin}:${currentSec < 10 ? '0' : ''}${currentSec}`;

      const systemPrompt = `You are CineBot, a charismatic, friendly, and knowledgeable AI Movie Assistant inside a real-time sync watch party application called SyncWatch.
The users are currently watching "${movieTitle || 'a movie'}" at timestamp ${timeFormatted}.
Your tone is enthusiastic, movie-buff savvy, fun, concise, and engaging.
IMPORTANT: Never give away major plot spoilers for parts of the movie beyond timestamp ${timeFormatted} unless explicitly asked!
Format your response using clear markdown with emojis where appropriate. Keep answers under 180 words so it fits nicely in the room chat.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question/Request: ${prompt}` }] }
        ]
      });

      const replyText = response.text || "🍿 CineBot is enjoying the movie with you! Let me know if you need trivia or plot explanations.";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.json({
        reply: `🎬 **CineBot Trivia**: Movie magic is in the air! Ask me about character backstories, easter eggs, or director notes!`
      });
    }
  });

  // Socket.IO Real-Time Handlers
  io.on('connection', (socket: Socket) => {

    socket.on('room:join', ({ roomId, user }: { roomId: string; user: Partial<RoomMember> }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      const isHost = room.members.length === 0 || room.hostId === user.id;
      const member: RoomMember = {
        id: user.id || `user-${Date.now()}`,
        name: user.name || 'Anonymous Moviegoer',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        role: isHost ? 'host' : 'viewer',
        isMuted: false,
        cameraOn: false,
        isBuffering: false,
        joinedAt: Date.now()
      };

      socket.join(roomId);
      socketUserMap.set(socket.id, { roomId, user: member });

      // Add to room members if not present
      if (!room.members.some(m => m.id === member.id)) {
        room.members.push(member);
      }
      room.activeViewerCount = room.members.length;

      // Current server-authoritative playback state
      const authState = getAuthoritativeState(room);

      // Send initial state to joining user
      socket.emit('room:initial-state', {
        room: {
          ...room,
          playbackState: authState
        },
        messages: chatMessages.get(roomId) || [],
        userRole: member.role
      });

      // Broadcast new member to room
      io.to(roomId).emit('room:member-joined', {
        member,
        activeViewerCount: room.members.length
      });

      // Send system message
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        content: `🍿 ${member.name} joined the watch party!`,
        type: 'system',
        timestamp: Date.now()
      };

      const msgs = chatMessages.get(roomId) || [];
      msgs.push(sysMsg);
      chatMessages.set(roomId, msgs);

      io.to(roomId).emit('chat:received', sysMsg);
    });

    // Playback sync events
    socket.on('playback:play', ({ roomId, positionMs }: { roomId: string; positionMs: number }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.playbackState = {
        ...room.playbackState,
        status: 'playing',
        positionMs: positionMs,
        serverTimestamp: Date.now()
      };

      const authState = getAuthoritativeState(room);
      io.to(roomId).emit('playback:sync-state', authState);

      // System notification in chat
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const sysMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          roomId,
          userId: 'system',
          userName: 'System',
          userAvatar: '',
          content: `▶️ ${userInfo.user.name} played the movie`,
          type: 'system',
          timestamp: Date.now()
        };
        const msgs = chatMessages.get(roomId) || [];
        msgs.push(sysMsg);
        io.to(roomId).emit('chat:received', sysMsg);
      }
    });

    socket.on('playback:pause', ({ roomId, positionMs }: { roomId: string; positionMs: number }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.playbackState = {
        ...room.playbackState,
        status: 'paused',
        positionMs: positionMs,
        serverTimestamp: Date.now()
      };

      const authState = getAuthoritativeState(room);
      io.to(roomId).emit('playback:sync-state', authState);

      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const sysMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          roomId,
          userId: 'system',
          userName: 'System',
          userAvatar: '',
          content: `⏸️ ${userInfo.user.name} paused the movie`,
          type: 'system',
          timestamp: Date.now()
        };
        const msgs = chatMessages.get(roomId) || [];
        msgs.push(sysMsg);
        io.to(roomId).emit('chat:received', sysMsg);
      }
    });

    socket.on('playback:seek', ({ roomId, positionMs }: { roomId: string; positionMs: number }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.playbackState = {
        ...room.playbackState,
        positionMs: positionMs,
        serverTimestamp: Date.now()
      };

      const authState = getAuthoritativeState(room);
      io.to(roomId).emit('playback:sync-state', authState);
    });

    socket.on('playback:media-change', ({ roomId, mediaId, streamUrl, title, durationSeconds, posterUrl }: {
      roomId: string; mediaId: string; streamUrl?: string; title?: string; durationSeconds?: number; posterUrl?: string;
    }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const movie = MOVIES.find(m => m.id === mediaId);

      room.playbackState = {
        status: 'playing',
        positionMs: 0,
        serverTimestamp: Date.now(),
        playbackRate: 1.0,
        mediaId: mediaId,
        mediaTitle: title || movie?.title || 'Custom Video',
        mediaStreamUrl: streamUrl || movie?.streamUrl || '',
        mediaDurationSeconds: durationSeconds || movie?.durationSeconds || 600,
        mediaPosterUrl: posterUrl || movie?.posterUrl || '',
        bufferingUsers: []
      };

      const authState = getAuthoritativeState(room);
      io.to(roomId).emit('playback:sync-state', authState);

      const userInfo = socketUserMap.get(socket.id);
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        content: `🎬 Now playing: "${room.playbackState.mediaTitle}" (changed by ${userInfo?.user.name || 'Host'})`,
        type: 'system',
        timestamp: Date.now()
      };
      const msgs = chatMessages.get(roomId) || [];
      msgs.push(sysMsg);
      io.to(roomId).emit('chat:received', sysMsg);
    });

    socket.on('playback:sync-request', ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId);
      if (room) {
        socket.emit('playback:sync-state', getAuthoritativeState(room));
      }
    });

    // Chat and Floating Reactions
    socket.on('chat:send', ({ roomId, content }: { roomId: string; content: string }) => {
      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomId,
        userId: userInfo.user.id,
        userName: userInfo.user.name,
        userAvatar: userInfo.user.avatar,
        content,
        type: 'text',
        timestamp: Date.now()
      };

      const msgs = chatMessages.get(roomId) || [];
      msgs.push(message);
      if (msgs.length > 200) msgs.shift(); // Keep last 200 msgs

      io.to(roomId).emit('chat:received', message);
    });

    socket.on('reaction:send', ({ roomId, emoji, xRatio }: { roomId: string; emoji: string; xRatio?: number }) => {
      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const reactionEvent: ReactionEvent = {
        id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        userId: userInfo.user.id,
        userName: userInfo.user.name,
        xRatio: xRatio !== undefined ? xRatio : Math.random() * 0.8 + 0.1,
        timestamp: Date.now()
      };

      io.to(roomId).emit('reaction:received', reactionEvent);
    });

    // Queue management
    socket.on('queue:add', ({ roomId, item }: { roomId: string; item: QueueItem }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.queue.push(item);
      io.to(roomId).emit('queue:updated', room.queue);

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        content: `➕ "${item.title}" added to queue by ${item.addedByName}`,
        type: 'system',
        timestamp: Date.now()
      };
      const msgs = chatMessages.get(roomId) || [];
      msgs.push(sysMsg);
      io.to(roomId).emit('chat:received', sysMsg);
    });

    socket.on('queue:remove', ({ roomId, queueItemId }: { roomId: string; queueItemId: string }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.queue = room.queue.filter(i => i.id !== queueItemId);
      io.to(roomId).emit('queue:updated', room.queue);
    });

    // WebRTC & Participant Media Toggles
    socket.on('webrtc:media-toggle', ({ roomId, isMuted, cameraOn }: { roomId: string; isMuted: boolean; cameraOn: boolean }) => {
      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      userInfo.user.isMuted = isMuted;
      userInfo.user.cameraOn = cameraOn;

      const room = rooms.get(roomId);
      if (room) {
        const member = room.members.find(m => m.id === userInfo.user.id);
        if (member) {
          member.isMuted = isMuted;
          member.cameraOn = cameraOn;
        }
        io.to(roomId).emit('room:members-updated', room.members);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const { roomId, user } = userInfo;
        const room = rooms.get(roomId);
        if (room) {
          room.members = room.members.filter(m => m.id !== user.id);
          room.activeViewerCount = room.members.length;

          io.to(roomId).emit('room:member-left', {
            userId: user.id,
            activeViewerCount: room.members.length
          });

          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            roomId,
            userId: 'system',
            userName: 'System',
            userAvatar: '',
            content: `👋 ${user.name} left the room`,
            type: 'system',
            timestamp: Date.now()
          };
          const msgs = chatMessages.get(roomId) || [];
          msgs.push(sysMsg);
          io.to(roomId).emit('chat:received', sysMsg);
        }
        socketUserMap.delete(socket.id);
      }
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncWatch Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
