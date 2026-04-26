import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../utils/api';
import type { BestScore, GameMode, User } from '../../types';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';
import BeatmapLink from '../UI/BeatmapLink';

interface UserFirstScoresProps {
  userId: number;
  selectedMode: GameMode;
  user?: User;
  className?: string;
}

const formatTimeAgo = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return t('profile.activities.timeAgo.justNow');
  if (diffInSeconds < 3600) return t('profile.activities.timeAgo.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('profile.activities.timeAgo.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 2592000) return t('profile.activities.timeAgo.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
  if (diffInSeconds < 31536000) return t('profile.activities.timeAgo.monthsAgo', { count: Math.floor(diffInSeconds / 2592000) });
  return t('profile.activities.timeAgo.yearsAgo', { count: Math.floor(diffInSeconds / 31536000) });
};

const getRankIcon = (rank: string) => {
  const rankImageMap: Record<string, string> = {
    XH: '/image/grades/SS-Silver.svg',
    X:  '/image/grades/SS.svg',
    SH: '/image/grades/S-Silver.svg',
    S:  '/image/grades/S.svg',
    A:  '/image/grades/A.svg',
    B:  '/image/grades/B.svg',
    C:  '/image/grades/C.svg',
    D:  '/image/grades/D.svg',
    F:  '/image/grades/F.svg',
  };
  return rankImageMap[rank] || rankImageMap['F'];
};

const ModsDisplay: React.FC<{ mods: Array<{ acronym: string }> }> = ({ mods }) => {
  if (!mods || mods.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {mods.map((mod, index) => (
        <div key={index} className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
          {mod.acronym}
        </div>
      ))}
    </div>
  );
};

const ScoreCard: React.FC<{ score: BestScore; t: any; profileColor: string }> = ({ score, t, profileColor }) => {
  const rank = score.rank;
  const title = score.beatmapset?.title_unicode || score.beatmapset?.title || 'Unknown Title';
  const artist = score.beatmapset?.artist_unicode || score.beatmapset?.artist || 'Unknown Artist';
  const version = score.beatmap?.version || 'Unknown';
  const endedAt = formatTimeAgo(score.ended_at, t);
  const accuracy = (score.accuracy * 100).toFixed(2);
  const pp = Math.round(score.pp || 0);
  const mods = score.mods || [];
  const beatmapUrl = score.beatmap?.url || '#';
  const coverImage = score.beatmapset?.covers?.['cover@2x'] || score.beatmapset?.covers?.cover;

  const hexToRgb = (hex: string): string => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };
  const themeRgb = hexToRgb(profileColor);

  return (
    <LazyBackgroundImage
      src={coverImage}
      className="relative overflow-hidden rounded-lg border border-gray-200/70 dark:border-gray-600/40 bg-card"
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to right, rgba(${themeRgb}, 0.15) 0%, rgba(${themeRgb}, 0.08) 50%, rgba(${themeRgb}, 0.03) 100%)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/60 dark:from-gray-800/90 dark:via-gray-800/75 dark:to-gray-800/60" />

      <div className="relative bg-transparent hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors duration-150">
        {/* Desktop */}
        <div className="hidden sm:block">
          <div className="flex items-center h-12 pl-5 pr-24">
            <div className="flex-shrink-0 mr-3">
              <img src={getRankIcon(rank)} alt={rank} className="w-14 h-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col -space-y-0.5">
                <div className="flex items-baseline gap-1 text-sm leading-tight">
                  <BeatmapLink beatmapUrl={beatmapUrl} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors" title={title}>
                    {title}
                  </BeatmapLink>
                  <span className="text-gray-600 dark:text-gray-400 text-xs flex-shrink-0">{t('profile.bestScores.by')}</span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs truncate">{artist}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">{version}</span>
                  <span className="text-gray-500 dark:text-gray-400">{endedAt}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 mr-6">
              <ModsDisplay mods={mods} />
              <div className="text-sm font-bold text-cyan-600 dark:text-cyan-300 ml-2">{accuracy}%</div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full flex items-center justify-center pr-4">
            <div className="text-sm font-bold text-profile-color">{pp} PP</div>
          </div>
        </div>

        {/* Mobile */}
        <div className="block sm:hidden p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <img src={getRankIcon(rank)} alt={rank} className="w-12 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 text-sm leading-tight mb-1">
                <BeatmapLink beatmapUrl={beatmapUrl} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors" title={title}>
                  {title}
                </BeatmapLink>
                <span className="text-gray-600 dark:text-gray-400 text-xs flex-shrink-0">{t('profile.bestScores.by')}</span>
                <span className="text-gray-600 dark:text-gray-400 text-xs truncate">{artist}</span>
              </div>
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">{version}</span>
                <span className="text-gray-500 dark:text-gray-400">{endedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ModsDisplay mods={mods} />
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-300">{accuracy}%</div>
                </div>
                <div className="text-sm font-bold text-profile-color">{pp} PP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LazyBackgroundImage>
  );
};

const UserFirstScores: React.FC<UserFirstScoresProps> = ({ userId, selectedMode, user, className = '' }) => {
  const { t } = useTranslation();
  const { profileColor } = useProfileColor();
  const [scores, setScores] = useState<BestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const LIMIT = 6;

  const loadScores = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      reset ? setLoading(true) : setLoadingMore(true);
      if (reset) { setError(null); setHasMore(true); }

      const response = await userAPI.getFirstScores(userId, selectedMode, LIMIT, currentOffset);
      const newScores = Array.isArray(response) ? response : [];

      if (reset) {
        setScores(newScores);
        setOffset(newScores.length);
        setHasMore(newScores.length === LIMIT);
      } else {
        const total = user?.scores_first_count || 0;
        const currentTotal = scores.length + newScores.length;
        setScores(prev => [...prev, ...newScores]);
        setOffset(prev => prev + newScores.length);
        setHasMore(newScores.length === LIMIT && currentTotal < total);
      }
    } catch (err) {
      console.error('Failed to load first place scores:', err);
      setError('Failed to load first place scores.');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setOffset(0);
      setScores([]);
      setError(null);
      setHasMore(true);
      loadScores(true);
    }
  }, [userId, selectedMode]);

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-osu-pink" />
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">First Place Ranks</h3>
      {user?.scores_first_count !== undefined && (
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {user.scores_first_count}
        </span>
      )}
    </div>
  );

  if (loading) return <div className={className}>{header}<LoadingSpinner size="md" /></div>;

  if (error) return (
    <div className={className}>
      {header}
      <div className="text-center text-red-500 dark:text-red-400 text-sm">{error}</div>
    </div>
  );

  if (scores.length === 0) return (
    <div className={className}>
      {header}
      <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">No first place ranks.</div>
    </div>
  );

  return (
    <div className={className}>
      {header}
      <div className="flex flex-col gap-1">
        {scores.map(score => (
          <ScoreCard key={score.id} score={score} t={t} profileColor={profileColor} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => !loadingMore && loadScores(false)}
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

export default UserFirstScores;