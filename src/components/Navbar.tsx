import React, { useState } from 'react';
import { Film, Users, Plus, Key, Sparkles, Tv, Compass, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'browse' | 'rooms' | 'room';
  setActiveTab: (tab: 'browse' | 'rooms') => void;
  onOpenCreateModal: () => void;
  onOpenJoinCodeModal: () => void;
  onOpenProfileModal: () => void;
  currentUser: UserProfile;
  currentRoomTitle?: string;
  onBackToRoom?: () => void;
  isInRoom: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenJoinCodeModal,
  onOpenProfileModal,
  currentUser,
  currentRoomTitle,
  onBackToRoom,
  isInRoom,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
              <Film className="h-5.5 w-5.5 fill-white/20" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
                SYNC<span className="text-rose-500">WATCH</span>
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                  LIVE
                </span>
              </span>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide">Sync Watch Parties</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === 'browse' && !isInRoom
                  ? 'bg-zinc-800/80 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Compass className="h-4 w-4" />
              Movie Catalog
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === 'rooms' && !isInRoom
                  ? 'bg-zinc-800/80 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Tv className="h-4 w-4 text-rose-400" />
              Live Parties
            </button>

            {isInRoom && currentRoomTitle && (
              <button
                onClick={onBackToRoom}
                className="flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3.5 py-2 text-sm font-medium text-rose-300 animate-pulse hover:bg-rose-500/25 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Active Room: {currentRoomTitle.length > 20 ? currentRoomTitle.substring(0, 20) + '...' : currentRoomTitle}
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenJoinCodeModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
            title="Join Party with Code"
          >
            <Key className="h-3.5 w-3.5 text-zinc-400" />
            Enter Code
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-red-500 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Start Watch Party</span>
            <span className="sm:hidden">New Party</span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 p-1 pr-3 hover:border-zinc-700 transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700"
            />
            <span className="hidden md:inline text-xs font-medium text-zinc-200 max-w-[100px] truncate">
              {currentUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
