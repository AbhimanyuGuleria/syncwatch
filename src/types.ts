export type PlaybackStatus = 'playing' | 'paused' | 'buffering';

export interface Subtitle {
  srclang: string;
  label: string;
  src: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  year: number;
  durationSeconds: number;
  rating: string;
  posterUrl: string;
  backdropUrl: string;
  streamUrl: string;
  qualityOptions?: string[];
  subtitles?: Subtitle[];
  director?: string;
  featured?: boolean;
}

export interface PlaybackState {
  status: PlaybackStatus;
  positionMs: number;
  serverTimestamp: number;
  playbackRate: number;
  mediaId: string;
  mediaTitle: string;
  mediaStreamUrl: string;
  mediaDurationSeconds: number;
  mediaPosterUrl?: string;
  bufferingUsers?: string[];
}

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'co-host' | 'viewer';
  isMuted: boolean;
  cameraOn: boolean;
  isBuffering: boolean;
  joinedAt: number;
  isSelf?: boolean;
}

export interface QueueItem {
  id: string;
  mediaId: string;
  title: string;
  streamUrl: string;
  durationSeconds: number;
  posterUrl?: string;
  addedBy: string;
  addedByName: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'text' | 'system' | 'reaction' | 'ai';
  timestamp: number;
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  xRatio: number; // 0 to 1 horizontal position
  timestamp: number;
}

export interface WatchRoom {
  id: string;
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  privacy: 'public' | 'private' | 'unlisted';
  passcode?: string;
  allowMemberControl: boolean;
  playbackState: PlaybackState;
  members: RoomMember[];
  queue: QueueItem[];
  createdAt: number;
  activeViewerCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  watchedCount: number;
  favoriteGenre: string;
}
