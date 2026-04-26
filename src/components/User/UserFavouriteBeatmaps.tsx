import React, { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import type { GameMode, User } from '../../types';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';

interface UserFavouriteBeatmapsProps {
  userId: number;
  user?: User;
  className?: string;
}

interface Beatmapset {
  id: number;
  title: string;
  title_unicode?: string;
  artist: string;
  artist_unicode?: string;
  creator: string;
  status: string;
  covers: {
    cover?: string;
    'cover@2x'?: string;
    card?: string;
    'card@2x'?: string;
  };
  beatmaps?: {
    id: number;
    version: string;
    difficulty_rating: number;
    mode: string;
    url?: string;
  }[];
}

const DifficultyDot: React.FC<{ rating: number }> = ({ rating }) => {
  const getColor = (r: number) => {
    if (r < 2) return '#4fc3f7';
    if (r < 2.7) return '#66bb6a';
    if (r < 4) return '#ffca28';
    if (r < 5.3) return '#ff7043';
    if (r < 6.5) return '#ab47bc';
    return '#37474f';
  };
  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: getColor(rating) }}
      title={`${rating.toFixed(2)}★`}
    />
  );
};

const BeatmapsetCard: React.FC<{ beatmapset: Beatmapset; profileColor: string }> = ({ beatmapset, profileColor }) => {
  const title = beatmapset.title_unicode || beatmapset.title;
  const artist = beatmapset.artist_unicode || beatmapset.artist;
  const cover = beatmapset.covers?.['cover@2x'] || beatmapset.covers?.cover;
  const url = `https://osu.ppy.sh/beatmapsets/${beatmapset.id}`;

  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '');
    return `${parseInt(c.substring(0,2),16)}, ${parseInt(c.substring(2,4),16)}, ${parseInt(c.substring(4,6),16)}`;
  };
  const themeRgb = hexToRgb(profileColor);

  const sortedDiffs = [...(beatmapset.beatmaps || [])].sort((a, b) => a.difficulty_rating - b.difficulty_rating);

  return (
    <LazyBackgroundImage
      src={cover}
      className="relative overflow-hidden rounded-lg border border-gray-200/70 dark:border-gray-600/40 bg-card"
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to right, rgba(${themeRgb}, 0.15) 0%, rgba(${themeRgb}, 0.05) 100%)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/60 dark:from-gray-800/90 dark:via-gray-800/75 dark:to-gray-800/60" />

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center h-14 px-4 gap-3 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
      >
        {/* Status pill */}
        <span className={`
          text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 capitalize
          ${beatmapset.status === 'ranked' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
            beatmapset.status === 'loved' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' :
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}
        `}>
          {beatmapset.status}
        </span>

        {/* Title + artist */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist} — mapped by {beatmapset.creator}</div>
        </div>

        {/* Difficulty dots */}
        {sortedDiffs.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {sortedDiffs.slice(0, 8).map(d => (
              <DifficultyDot key={d.id} rating={d.difficulty_rating} />
            ))}
            {sortedDiffs.length > 8 && (
              <span className="text-[10px] text-gray-400">+{sortedDiffs.length - 8}</span>
            )}
          </div>
        )}
      </a>
    </LazyBackgroundImage>
  );
};

const UserFavouriteBeatmaps: React.FC<UserFavouriteBeatmapsProps> = ({ userId, user, className = '' }) => {
  const { profileColor } = useProfileColor();
  const [beatmapsets, setBeatmapsets] = useState<Beatmapset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const LIMIT = 6;

  const load = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      reset ? setLoading(true) : setLoadingMore(true);
      if (reset) { setError(null); setHasMore(true); }

      const response = await userAPI.getFavouriteBeatmapsets(userId, LIMIT, currentOffset);
      const items = Array.isArray(response) ? response : [];

      if (reset) {
        setBeatmapsets(items);
        setOffset(items.length);
        setHasMore(items.length === LIMIT);
      } else {
        const total = user?.favourite_beatmapset_count || 0;
        const currentTotal = beatmapsets.length + items.length;
        setBeatmapsets(prev => [...prev, ...items]);
        setOffset(prev => prev + items.length);
        setHasMore(items.length === LIMIT && currentTotal < total);
      }
    } catch (err) {
      console.error('Failed to load favourite beatmapsets:', err);
      setError('Failed to load favourite beatmapsets.');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setOffset(0);
      setBeatmapsets([]);
      setError(null);
      setHasMore(true);
      load(true);
    }
  }, [userId]);

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-osu-pink" />
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Favourite Beatmaps</h3>
      {user?.favourite_beatmapset_count !== undefined && (
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {user.favourite_beatmapset_count}
        </span>
      )}
    </div>
  );

  if (loading) return <div className={className}>{header}<LoadingSpinner size="md" /></div>;
  if (error) return <div className={className}>{header}<div className="text-center text-red-500 dark:text-red-400 text-sm">{error}</div></div>;
  if (beatmapsets.length === 0) return (
    <div className={className}>
      {header}
      <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">No favourite beatmaps.</div>
    </div>
  );

  return (
    <div className={className}>
      {header}
      <div className="flex flex-col gap-1">
        {beatmapsets.map(bs => (
          <BeatmapsetCard key={bs.id} beatmapset={bs} profileColor={profileColor} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => !loadingMore && load(false)}
            disabled={loadingMore}
            className="min-w-[80px] sm:min-w-[100px] h-[32px] px-3 py-1.5 disabled:bg-gray-400 text-white rounded text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: loadingMore ? undefined : profileColor }}
          >
            {loadingMore ? <><LoadingSpinner size="sm" /><span>Loading...</span></> : <span>Show more</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserFavouriteBeatmaps;