import React, { useState } from 'react';
import { Play, Sparkles, Film, Clock, Star, Plus, Link, Upload, Compass } from 'lucide-react';
import { Movie } from '../types';
import { MOVIES } from '../data/movies';

interface BrowseViewProps {
  onStartWatchParty: (movie: Movie) => void;
  onOpenCreateModal: () => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  onStartWatchParty,
  onOpenCreateModal,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const featuredMovie = MOVIES[0]; // Sintel

  const genres = ['All', 'Animation', 'Sci-Fi', 'Comedy', 'Documentary', 'Adventure'];

  const filteredMovies = MOVIES.filter((movie) => {
    const matchesGenre = selectedGenre === 'All' || movie.genre.includes(selectedGenre);
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          movie.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    return `${m} mins`;
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* Featured Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src={featuredMovie.backdropUrl}
            alt={featuredMovie.title}
            className="h-full w-full object-cover opacity-35 filter blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-6 sm:p-10 md:p-12 min-h-[420px] max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-300">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" /> Featured Movie
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {featuredMovie.year}
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {featuredMovie.rating}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-3">
            {featuredMovie.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6 line-clamp-3">
            {featuredMovie.description}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartWatchParty(featuredMovie)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 active:scale-95 transition-all"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Start Sync Watch Party</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors backdrop-blur-md"
            >
              <Plus className="h-4 w-4" />
              <span>Custom Stream Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Genre Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie catalog..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Movies Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Compass className="h-5 w-5 text-rose-500" />
            Watch Party Movie Library
          </h2>
          <span className="text-xs text-zinc-400 font-medium">{filteredMovies.length} movies ready to stream</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/70 transition-all hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-950/30"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
                <img
                  src={movie.backdropUrl || movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="rounded-md bg-black/70 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {movie.rating}
                  </span>
                  <span className="rounded-md bg-black/70 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 backdrop-blur-sm flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-rose-400" />
                    {formatDuration(movie.durationSeconds)}
                  </span>
                </div>

                {/* Hover Play CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                  <button
                    onClick={() => onStartWatchParty(movie)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/40 hover:scale-110 active:scale-90 transition-all"
                  >
                    <Play className="h-6 w-6 fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                    {movie.title}
                  </h3>
                  <span className="text-xs font-semibold text-zinc-500">{movie.year}</span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {movie.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <div className="flex flex-wrap gap-1">
                    {movie.genre.slice(0, 2).map((g) => (
                      <span key={g} className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {g}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onStartWatchParty(movie)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    Host Room →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Stream Host Box Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <Link className="h-5 w-5 text-rose-400" />
            Have Your Own Video Stream or YouTube Link?
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Create a custom sync room instantly with any direct MP4 file, HLS video stream, or online movie link. Everyone's video player will stay 100% synchronized!
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex-none rounded-xl bg-zinc-800 border border-zinc-700 px-6 py-3 text-xs font-bold text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all"
        >
          Host Custom Video Room
        </button>
      </div>

    </div>
  );
};
