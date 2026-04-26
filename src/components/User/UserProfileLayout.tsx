import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../UI/Avatar';
import GameModeSelector from '../UI/GameModeSelector';
import RankHistoryChart from '../UI/RankHistoryChart';
import PlayerRankCard from '../User/PlayerRankCard';
import StatsCard from '../User/StatsCard';
import LevelProgress from '../UI/LevelProgress';
import { type User, type GameMode } from '../../types';
import FriendStats from './FriendStats';
import UserRecentActivity from './UserRecentActivity';
import UserPinnedScores from './UserPinnedScores';
import UserBestScores from './UserBestScores';
import UserRecentScores from './UserRecentScores';
import UserPageDisplay from './UserPageDisplay';
import UserMedals from './UserMedals';
import UserHistorical from './UserHistorical';
import RestrictedBanner from './RestrictedBanner';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { useAuth } from '../../hooks/useAuth';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useProfileColor } from '../../contexts/ProfileColorContext';

type ProfileTab = 'me' | 'ranks' | 'medals' | 'historical' | 'beatmaps' | 'recent';

interface UserProfileLayoutProps {
  user: User;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onUserUpdate?: (user: User) => void;
}

const formatPlayTime = (seconds: number | undefined): string => {
  if (!seconds) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
};

const CoverImage: React.FC<{ src?: string; alt?: string; isExpanded: boolean }> = ({ src, alt = 'cover', isExpanded }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const defaultCover = '/image/backgrounds/layered-waves-haikei.svg';
  const displaySrc = (!src || error) ? defaultCover : src;

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }); },
      { rootMargin: '200px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const heightClass = isExpanded ? 'h-[180px] md:h-[288px]' : 'h-0';

  return (
    <div ref={ref} className={`relative w-full overflow-hidden transition-all duration-300 ${heightClass}`}>
      <div className="absolute inset-0 cover-bg">
        <div className="h-full w-full" style={{ background: 'transparent' }} />
      </div>
      {inView && displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { if (displaySrc !== defaultCover) setError(true); }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
    </div>
  );
};

// Tab definitions
const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'me', label: 'me!' },
  { id: 'ranks', label: 'Ranks' },
  { id: 'medals', label: 'Medals' },
  { id: 'historical', label: 'Historical' },
  { id: 'beatmaps', label: 'Beatmaps' },
  { id: 'recent', label: 'Recent' },
];

// Section header shared component
const SectionHeader: React.FC<{ title: string; count?: number | string }> = ({ title, count }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-5 rounded-full bg-osu-pink" />
    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
    {count !== undefined && (
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// Under construction placeholder for unbuilt tabs
const UnderConstruction: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
    <div className="text-4xl">🚧</div>
    <p className="text-sm">{label} — coming soon</p>
  </div>
);

const UserProfileLayout: React.FC<UserProfileLayoutProps> = ({ user, selectedMode, onModeChange, onUserUpdate }) => {
  const { t } = useTranslation();
  const { refreshUser, user: currentUser } = useAuth();
  const { preferences, updatePreference } = useUserPreferences();
  const { profileColor, setProfileColorLocal, resetProfileColor } = useProfileColor();

  const [activeTab, setActiveTab] = useState<ProfileTab>('me');

  const pinnedScoresRefreshRef = useRef<(() => void) | null>(null);
  const bestScoresRefreshRef = useRef<(() => void) | null>(null);
  const pinActionRef = useRef<{
    handlePin: (score: any) => void;
    handleUnpin: (scoreId: number) => void;
  } | null>(null);
  const bestScoresActionRef = useRef<{
    updatePinStatus: (scoreId: number, isPinned: boolean) => void;
  } | null>(null);

  const stats = user.statistics_rulesets?.[selectedMode] ?? user.statistics;
  const gradeCounts = stats?.grade_counts ?? { ssh: 0, ss: 0, sh: 0, s: 0, a: 0 };
  const levelProgress = stats?.level?.progress ?? 0;
  const levelCurrent = stats?.level?.current ?? 0;
  const playTime = formatPlayTime(stats?.play_time);
  const user_achievements = Array.isArray(user.user_achievements)
    ? user.user_achievements.filter(
        (a): a is { achievement_id: number; achieved_at: string } =>
          typeof a === 'object' && a !== null &&
          typeof (a as any).achievement_id === 'number' &&
          typeof (a as any).achieved_at === 'string'
      )
    : undefined;

  const coverUrlRaw = user.cover_url || user.cover?.url || undefined;
  const coverUrl =
    coverUrlRaw === 'https://assets.ppy.sh/user-profile-covers/default.jpeg'
      ? '/image/backgrounds/bgcover.jpg'
      : coverUrlRaw;

  const [isUpdatingMode] = useState(false);
  const canEdit = currentUser?.id === user.id;

  useEffect(() => {
    const getViewedUserColor = () => {
      if (currentUser?.id === user.id) {
        try {
          const storedColor = localStorage.getItem('user_profile_color');
          if (storedColor) return storedColor;
        } catch (e) {}
      }
      const rawColor = user.profile_colour || 'ED8EA6';
      return rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
    };
    setProfileColorLocal(getViewedUserColor());
    return () => resetProfileColor();
  }, [user.profile_colour, user.id, currentUser?.id, setProfileColorLocal, resetProfileColor]);

  const [isCoverExpanded, setIsCoverExpanded] = useState(() => preferences.profile_cover_expanded ?? false);

  useEffect(() => {
    if (preferences.profile_cover_expanded !== undefined) {
      setIsCoverExpanded(preferences.profile_cover_expanded);
    }
  }, [preferences.profile_cover_expanded]);

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    setTimeout(async () => { await refreshUser(); }, 3000);
  };

  const handleToggleCover = async () => {
    const newExpandedState = !isCoverExpanded;
    setIsCoverExpanded(newExpandedState);
    if (canEdit) await updatePreference('profile_cover_expanded', newExpandedState);
  };

  // Reset to me tab when mode changes
  useEffect(() => {
    setActiveTab('me');
  }, [selectedMode]);

  return (
    <main className="max-w-7xl mx-auto px-0 md:px-4 lg:px-6 py-4 md:py-6">
      <div className="bg-card md:main-card-shadow md:rounded-t-2xl md:rounded-b-2xl overflow-hidden md:border md:border-card">

        {/* Restricted banner */}
        {user.is_restricted && currentUser?.is_admin && (
          <div className="px-3 md:px-6 pt-4">
            <RestrictedBanner />
          </div>
        )}

        {/* Top bar: title + mode selector */}
        <div className="relative">
          <div className="relative z-10 bg-transparent md:bg-card px-4 md:px-6 py-3 md:py-4 flex items-center justify-between md:rounded-t-2xl border-b border-card">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-osu-pink rounded-full" />
              <div className="text-base md:text-lg font-bold">{t('profile.info.title')}</div>
            </div>
            <GameModeSelector selectedMode={selectedMode} onModeChange={onModeChange} variant="compact" />
          </div>
          <div className="overflow-hidden">
            <CoverImage src={coverUrl} alt={`${user.username} cover`} isExpanded={isCoverExpanded} />
          </div>
        </div>

        {/* Avatar + username row */}
        <div className="bg-transparent md:bg-card px-3 md:px-8 py-4 md:py-6 flex items-center gap-4 md:gap-6 border-b border-card relative">
          <div className={isCoverExpanded ? '-mt-12' : 'mt-0'}>
            <Avatar
              userId={user.id}
              username={user.username}
              avatarUrl={user.avatar_url}
              size="xl"
              shape="rounded"
              editable={false}
              className={
                isCoverExpanded
                  ? 'mt-[10px] md:mt-[1px] md:!w-32 md:!h-32 md:!min-w-32 md:!min-h-32 transition-all duration-300'
                  : 'mt-[10px] md:mt-[1px] md:!w-24 md:!h-24 md:!min-w-24 md:!min-h-24 transition-all duration-300'
              }
              onAvatarUpdate={handleAvatarUpdate}
            />
          </div>
          <div className="flex-1">
            <h1 className="mt-[-12px] md:mt-[-15px] ml-0 md:ml-[-10px] text-xl md:text-3xl font-bold mb-3 md:mb-2 text-gray-900 dark:text-gray-100">
              {user.username}
            </h1>
            <div className="flex mt-[-10px] items-center gap-2 md:gap-4 md:mt-[10px] md:ml-[-8px] flex-wrap">
              {user.country?.code && (
                <div className="flex items-center gap-2">
                  <img
                    src={`/image/flag/${user.country.code.toLowerCase()}.svg`}
                    alt={user.country.name}
                    className="h-[20px] md:h-[25px] w-auto rounded-sm object-contain cursor-help"
                    loading="lazy"
                    decoding="async"
                    data-tooltip-id="country-tooltip"
                    data-tooltip-content={user.country?.name || ''}
                  />
                  <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {user.country?.code}
                  </span>
                </div>
              )}
              {user.team && (
                <div className="flex items-center gap-2">
                  <img
                    src={user.team.flag_url}
                    alt="team flag"
                    className="h-[20px] md:h-[25px] w-auto rounded-sm object-contain cursor-help"
                    loading="lazy"
                    decoding="async"
                    data-tooltip-id="team-tooltip"
                    data-tooltip-content={user.team.name}
                  />
                  <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {user.team.short_name || user.team.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleCover}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 grid place-items-center text-sm md:text-base hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
            aria-label={isCoverExpanded ? t('profile.userPage.collapseCover') : t('profile.userPage.expandCover')}
            data-tooltip-id="cover-toggle-tooltip"
            data-tooltip-content={isCoverExpanded ? t('profile.userPage.collapseCover') : t('profile.userPage.expandCover')}
          >
            {isCoverExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        <Tooltip id="country-tooltip" />
        <Tooltip id="team-tooltip" />
        <Tooltip id="cover-toggle-tooltip" />

        {/* Rank + chart + stats block — always visible above tabs */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 py-4 border-b border-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[3] flex flex-col gap-3">
              <div className="flex gap-8 p-3 md:rounded-lg md:rank-card-shadow mb-[20px] ml-0 md:ml-[-10px]">
                <div className="text-center">
                  <div className="text-gray-500 dark:text-gray-400 mb-1 text-[12px]">{t('profile.info.globalRank')}</div>
                  <div className="font-bold text-primary text-[20px]">#{stats?.global_rank ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-[12px]">{t('profile.info.countryRank')}</div>
                  <div className="font-bold text-primary text-[20px]">#{stats?.country_rank ?? '—'}</div>
                </div>
              </div>
              <div className="w-full mt-[-45px]">
                <RankHistoryChart
                  rankHistory={user.rank_history}
                  isUpdatingMode={isUpdatingMode}
                  selectedModeColor={profileColor}
                  delay={0.4}
                  height="8rem"
                />
              </div>
              <div className="w-full mt-[-55px]">
                <PlayerRankCard
                  stats={stats}
                  playTime={playTime}
                  user_achievements={user_achievements}
                  gradeCounts={gradeCounts}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="p-3 md:rounded-lg h-full flex flex-col justify-center md:stats-card-shadow" style={{ background: 'var(--bg-secondary)' }}>
                <StatsCard stats={stats} />
              </div>
            </div>
          </div>
        </div>

        {/* Friends + level progress — always visible */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 relative border-b border-card">
          <div className="flex items-center justify-between relative">
            <FriendStats user={user} />
            <div className="flex items-center gap-4">
              <LevelProgress
                levelCurrent={levelCurrent}
                levelProgress={levelProgress}
                className="flex-1"
                tint={profileColor}
              />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="bg-card border-b border-card sticky top-0 z-20">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 md:px-6 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150
                  ${activeTab === tab.id
                    ? 'border-osu-pink text-osu-pink'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-card md:rounded-b-2xl">

          {/* ── me! ── */}
          {activeTab === 'me' && (
            <div>
              {/* Personal intro */}
              <div className="px-3 md:px-6 lg:px-8 py-4 border-b border-card">
                <UserPageDisplay user={user} onUserUpdate={onUserUpdate} />
              </div>

              {/* Recent activity */}
              <div className="px-3 md:px-6 lg:px-8 py-4 border-b border-card">
                <UserRecentActivity userId={user.id} />
              </div>
            </div>
          )}

          {/* ── Ranks ── */}
          {activeTab === 'ranks' && (
            <div>
              {/* Pinned scores */}
              <div className="px-3 md:px-6 lg:px-8 py-4 border-b border-card">
                <UserPinnedScores
                  userId={user.id}
                  selectedMode={selectedMode}
                  user={user}
                  refreshRef={pinnedScoresRefreshRef}
                  onPinActionRef={pinActionRef}
                  bestScoresActionRef={bestScoresActionRef}
                />
              </div>

              {/* Best scores */}
              <div className="px-3 md:px-6 lg:px-8 py-4 border-b border-card">
                <UserBestScores
                  userId={user.id}
                  selectedMode={selectedMode}
                  user={user}
                  refreshRef={bestScoresRefreshRef}
                  onPinnedListRefresh={() => pinnedScoresRefreshRef.current?.()}
                  pinActionRef={pinActionRef}
                  bestScoresActionRef={bestScoresActionRef}
                />
              </div>

              {/* First place ranks placeholder */}
              <div className="px-3 md:px-6 lg:px-8 py-4">
                <SectionHeader
                  title="First Place Ranks"
                  count={user.scores_first_count ?? 0}
                />
                <UnderConstruction label="First place ranks" />
              </div>
            </div>
          )}

          {/* ── Medals ── */}
          {activeTab === 'medals' && (
            <div className="px-3 md:px-6 lg:px-8 py-4">
              <UserMedals userAchievements={user.user_achievements} />
            </div>
          )}

          {/* ── Historical ── */}
          {activeTab === 'historical' && (
            <div>
              <div className="px-3 md:px-6 lg:px-8 py-4 border-b border-card">
                <UserRecentScores userId={user.id} selectedMode={selectedMode} user={user} />
              </div>
              <div className="px-3 md:px-6 lg:px-8 py-4">
                <UserHistorical userId={user.id} monthlyPlaycounts={user.monthly_playcounts} />
              </div>
            </div>
          )}

          {/* ── Beatmaps ── */}
          {activeTab === 'beatmaps' && (
            <div className="px-3 md:px-6 lg:px-8 py-4">
              <SectionHeader title="Favourite Beatmaps" count={user.favourite_beatmapset_count ?? 0} />
              <UnderConstruction label="Beatmaps" />
            </div>
          )}

          {/* ── Recent ── */}
          {activeTab === 'recent' && (
            <div className="px-3 md:px-6 lg:px-8 py-4">
              <UserRecentActivity userId={user.id} />
            </div>
          )}

        </div>
      </div>
    </main>
  );
};

export default UserProfileLayout;