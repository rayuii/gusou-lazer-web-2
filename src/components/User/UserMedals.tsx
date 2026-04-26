import React, { useEffect, useState } from 'react';
import { useProfileColor } from '../../contexts/ProfileColorContext';

interface Achievement {
  achievement_id: number;
  achieved_at: string;
}

interface MedalInfo {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_url: string;
}

interface UserMedalsProps {
  userAchievements: unknown[];
  className?: string;
}

const SectionHeader: React.FC<{ title: string; count?: number; profileColor: string }> = ({ title, count, profileColor }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: profileColor }} />
    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
    {count !== undefined && (
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

const MedalIcon: React.FC<{ medal: MedalInfo; unlocked: boolean; achievedAt?: string }> = ({
  medal, unlocked, achievedAt
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center gap-1 cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
        ${unlocked
          ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 group-hover:scale-110'
          : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-40 grayscale'
        }`}
      >
        {!imgError ? (
          <img
            src={medal.icon_url}
            alt={medal.name}
            className="w-10 h-10 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xl">{unlocked ? '🏅' : '○'}</span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-max max-w-[160px] bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 text-center pointer-events-none shadow-lg">
          <div className="font-semibold">{medal.name}</div>
          <div className="text-gray-300 mt-0.5">{medal.description}</div>
          {unlocked && achievedAt && (
            <div className="text-gray-300 mt-0.5">
              {new Date(achievedAt).toLocaleDateString()}
            </div>
          )}
          {!unlocked && <div className="text-gray-400 mt-0.5">Locked</div>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
};

const UserMedals: React.FC<UserMedalsProps> = ({ userAchievements, className = '' }) => {
  const { profileColor } = useProfileColor();
  const [medals, setMedals] = useState<MedalInfo[]>([]);

  useEffect(() => {
    fetch('/api/v2/medals')
      .then(r => r.json())
      .then(setMedals)
      .catch(() => {});
  }, []);

  const achievements = (userAchievements as Achievement[]).filter(
    a => typeof a === 'object' && a !== null && 'achievement_id' in a
  );

  const unlockedIds = new Set(achievements.map(a => a.achievement_id));
  const achievedAtMap = new Map(achievements.map(a => [a.achievement_id, a.achieved_at]));

  const latestAchievements = [...achievements]
    .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
    .slice(0, 8);

  const latestMedals = latestAchievements
    .map(a => medals.find(m => m.id === a.achievement_id))
    .filter((m): m is MedalInfo => m !== undefined);

  if (achievements.length === 0) {
    return (
      <div className={className}>
        <SectionHeader title="Medals" count={0} profileColor={profileColor} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-sm">
          No medals yet
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <SectionHeader title="Medals" count={achievements.length} profileColor={profileColor} />

      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
          Latest
        </div>
        <div className="flex flex-wrap gap-3">
          {latestMedals.map(medal => (
            <MedalIcon
              key={medal.id}
              medal={medal}
              unlocked={true}
              achievedAt={achievedAtMap.get(medal.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
          All Unlocked ({achievements.length})
        </div>
        <div className="flex flex-wrap gap-3">
          {medals.filter(m => unlockedIds.has(m.id)).map(medal => (
            <MedalIcon
              key={medal.id}
              medal={medal}
              unlocked={true}
              achievedAt={achievedAtMap.get(medal.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserMedals;