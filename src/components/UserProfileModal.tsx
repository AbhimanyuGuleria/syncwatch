import React, { useState } from 'react';
import { X, User, Check, Sparkles, Film, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateUser({
      name: name.trim(),
      avatar: selectedAvatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">Your Profile</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Choose Avatar</label>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
              {AVATAR_PRESETS.map((avUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(avUrl)}
                  className={`relative rounded-full p-0.5 transition-all ${
                    selectedAvatar === avUrl ? 'ring-2 ring-rose-500 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={avUrl} alt="Avatar option" className="h-12 w-12 rounded-full object-cover" />
                  {selectedAvatar === avUrl && (
                    <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white ring-1 ring-zinc-950">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Cinema"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Stats Box */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <span className="text-xs font-bold text-zinc-300 block">Your Watch Party Stats</span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <span className="text-lg font-black text-rose-400 block font-display">12</span>
                <span className="text-[10px] text-zinc-400">Parties Joined</span>
              </div>
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <span className="text-lg font-black text-emerald-400 block font-display">4.2 hrs</span>
                <span className="text-[10px] text-zinc-400">Time Synced</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500"
            >
              Save Profile
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
