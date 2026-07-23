import React, { useState } from 'react';
import { X, Key, ArrowRight } from 'lucide-react';

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinByCode: (code: string) => void;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({
  isOpen,
  onClose,
  onJoinByCode,
}) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onJoinByCode(code.trim().toUpperCase());
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">Join Room by Code</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Enter 6-Letter Room Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LOUNGE"
              maxLength={8}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-rose-400 placeholder-zinc-600 uppercase focus:border-rose-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500"
          >
            <span>Enter Room</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
