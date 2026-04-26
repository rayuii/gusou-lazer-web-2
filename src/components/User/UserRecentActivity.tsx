import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../utils/api';
import type { UserActivity } from '../../types';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import BeatmapLink from '../UI/BeatmapLink';
import { FaUpload, FaEdit, FaHeart, FaUser, FaTrophy, FaCrown } from 'react-icons/fa';

interface UserRecentActivityProps {
  userId: number;
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

const GRADE_IMAGES: Record<string, string> = {
  SSH: '/image/grades/SS-Silver.svg',
  SS: '/image/grades/SS.svg',
  SH: '/image/grades/S-Silver.svg',
  S: '/image/grades/S.svg',
  A: '/image/grades/A.svg',
  B: '/image/grades/B.svg',
  C: '/image/grades/C.svg',
  D: '/image/grades/D.svg',
  F: '/image/grades/F.svg',
};

const AchievementIcon: React.FC<{ slug: string; alt: string; className?: string }> = ({ slug, alt, className = 'w-6 h-6' }) => {
  const [imgSrc, setImgSrc] = useState(`/image/achievement_images/${slug}@2x.png`);
  const [hasError, setHasError] = useState(false);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => { if (!hasError) { setImgSrc(`/image/achievement_images/${slug}.png`); setHasError(true); } }}
    />
  );
};

const getActivityIcon = (activity: UserActivity) => {
  switch (activity.type) {
    case 'rank':
      return activity.scorerank ? (
        <img src={GRADE_IMAGES[activity.scorerank] || GRADE_IMAGES['F']} alt={activity.scorerank} className="w-5 h-5" />
      ) : <FaTrophy className="w-4 h-4 text-yellow-500" />;
    case 'rank_lost':
      return <FaTrophy className="w-4 h-4 text-gray-400" />;
    case 'achievement':
      return activity.achievement ? (
        <AchievementIcon slug={activity.achievement.slug} alt={activity.achievement.name || activity.achievement.slug} className="w-5 h-5" />
      ) : <FaCrown className="w-4 h-4 text-purple-500" />;
    case 'beatmapset_upload':
      return <FaUpload className="w-4 h-4 text-blue-500" />;
    case 'beatmapset_approve':
    case 'beatmapset_revive':
    case 'beatmapset_update':
      return <FaEdit className="w-4 h-4 text-green-500" />;
    case 'user_support_again':
    case 'user_support_first':
    case 'user_support_gift':
      return <FaHeart className="w-4 h-4 text-red-500" />;
    case 'username_change':
    case 'userpageUpdate':
      return <FaUser className="w-4 h-4 text-blue-400" />;
    default:
      return <FaTrophy className="w-4 h-4 text-gray-500" />;
  }
};

const getActivityDescription = (activity: UserActivity, profileColor: string) => {
  const username = <span className="font-medium" style={{ color: profileColor }}>{activity.user?.username}</span>;

  switch (activity.type) {
    case 'rank':
      return (
        <span>
          {username}{' '}achieved rank{' '}
          <strong className="text-yellow-400">#{activity.rank}</strong>
          {' '}on{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'rank_lost':
      return (
        <span>
          {username}{' '}has lost first place on{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'achievement':
      return (
        <span>
          {username}{' '}unlocked the{' '}
          <span className="font-medium text-purple-400">"{activity.achievement?.name || activity.achievement?.slug}"</span>
          {' '}medal!
        </span>
      );
    case 'beatmapset_upload':
      return (
        <span>
          {username}{' '}submitted a new beatmap{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'beatmapset_approve':
      return (
        <span>
          {username}{' '}had their beatmap ranked{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'beatmapset_revive':
      return (
        <span>
          {username}{' '}revived their beatmap{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'beatmapset_update':
      return (
        <span>
          {username}{' '}updated their beatmap{' '}
          <BeatmapLink beatmapUrl={activity.beatmap?.url} className="text-blue-400 hover:underline font-medium" title={activity.beatmap?.title}>
            {activity.beatmap?.title}
          </BeatmapLink>
        </span>
      );
    case 'user_support_again':
      return <span>{username}{' '}has once again chosen to support osu!</span>;
    case 'user_support_first':
      return <span>{username}{' '}has become an osu! supporter!</span>;
    case 'user_support_gift':
      return <span>{username}{' '}received the gift of osu! supporter!</span>;
    case 'username_change':
      return <span>{username}{' '}changed their username!</span>;
    case 'userpageUpdate':
      return <span>{username}{' '}updated their profile page.</span>;
    default:
      return <span>{username}{' '}did something.</span>;
  }
};

const UserRecentActivity: React.FC<UserRecentActivityProps> = ({ userId, className = '' }) => {
  const { t } = useTranslation();
  const { profileColor } = useProfileColor();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const loadActivities = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      if (reset) { setLoading(true); setError(null); } else { setLoadingMore(true); }
      const response = await userAPI.getRecentActivity(userId, 6, currentOffset);
      const newActivities = Array.isArray(response) ? response : [];
      if (reset) { setActivities(newActivities); setOffset(newActivities.length); }
      else { setActivities(prev => [...prev, ...newActivities]); setOffset(prev => prev + newActivities.length); }
      setHasMore(newActivities.length === 6);
    } catch (err) {
      console.error('Failed to load user activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userId) { setOffset(0); loadActivities(true); }
  }, [userId]);

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 bg-osu-pink rounded-full" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('profile.activities.title')}</h3>
    </div>
  );

  if (loading) return <div className={className}>{header}<LoadingSpinner size="md" /></div>;
  if (error) return <div className={className}>{header}<div className="text-center text-red-500 text-sm">{error}</div></div>;

  return (
    <div className={className}>
      {header}
      {activities.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
          {t('profile.activities.noActivities')}
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 py-2 px-2 rounded border border-gray-200/50 dark:border-gray-600/30"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {getActivityIcon(activity)}
              </div>
              <div className="flex-grow min-w-0 text-sm text-gray-900 dark:text-gray-100">
                {getActivityDescription(activity, profileColor)}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {activity.mode && <span>{activity.mode}</span>}
                <span className="whitespace-nowrap">{formatTimeAgo(activity.createdAt, t)}</span>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => { if (!loadingMore && hasMore) loadActivities(false); }}
                disabled={loadingMore}
                className="min-w-[100px] h-[32px] px-3 py-1.5 disabled:bg-gray-400 text-white rounded text-sm transition-colors flex items-center justify-center gap-1.5"
                style={{ backgroundColor: loadingMore ? undefined : profileColor }}
              >
                {loadingMore ? <><LoadingSpinner size="sm" /><span>Loading...</span></> : <span>{t('profile.activities.loadMore')}</span>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRecentActivity;