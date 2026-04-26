import React, { useEffect, useState } from 'react';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import { userAPI } from '../../utils/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface MonthlyPlaycount {
  start_date: string;
  count: number;
}

interface MostPlayedBeatmap {
  beatmap_id: number;
  count: number;
  beatmap: {
    id: number;
    url: string;
    version: string;
  };
  beatmapset: {
    id: number;
    title: string;
    title_unicode?: string;
    artist: string;
    artist_unicode?: string;
    covers?: {
      list?: string;
      'list@2x'?: string;
      cover?: string;
      'cover@2x'?: string;
    };
    creator?: string;
  };
}

interface UserHistoricalProps {
  userId: number;
  monthlyPlaycounts: MonthlyPlaycount[];
  className?: string;
}

const SectionHeader: React.FC<{ title: string; count?: number; profileColor: string }> = ({ title, count, profileColor }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: profileColor }} />
    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
    {count !== undefined && (
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// Simple SVG line chart — no external deps needed
const PlayHistoryChart: React.FC<{ data: MonthlyPlaycount[]; color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">
        No play history data
      </div>
    );
  }

  const width = 600;
  const height = 120;
  const padL = 40;
  const padR = 8;
  const padT = 8;
  const padB = 24;

  const counts = data.map(d => d.count);
  const maxCount = Math.max(...counts, 1);
  const minCount = 0;

  const xStep = (width - padL - padR) / Math.max(data.length - 1, 1);

  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + (height - padT - padB) * (1 - (v - minCount) / (maxCount - minCount));

  const points = data.map((d, i) => `${toX(i)},${toY(d.count)}`).join(' ');
  const fillPoints = [
    `${toX(0)},${height - padB}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.count)}`),
    `${toX(data.length - 1)},${height - padB}`,
  ].join(' ');

  // Year labels — show Jan of each year
  const yearLabels: { x: number; label: string }[] = [];
  data.forEach((d, i) => {
    const date = new Date(d.start_date);
    if (date.getMonth() === 0) {
      yearLabels.push({ x: toX(i), label: `Jan ${date.getFullYear()}` });
    }
  });

  // Y axis ticks
  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 320, height: 120 }}>
        {/* Grid lines */}
        {yTicks.map(tick => (
          <line
            key={tick}
            x1={padL} y1={toY(tick)}
            x2={width - padR} y2={toY(tick)}
            stroke={gridColor} strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map(tick => (
          <text
            key={tick}
            x={padL - 4} y={toY(tick) + 4}
            textAnchor="end" fontSize="9" fill={textColor}
          >
            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
          </text>
        ))}

        {/* Area fill */}
        <polygon
          points={fillPoints}
          fill={color}
          fillOpacity="0.12"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* X axis year labels */}
        {yearLabels.map(({ x, label }) => (
          <text
            key={label}
            x={x} y={height - 4}
            textAnchor="middle" fontSize="9" fill={textColor}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};

const MostPlayedBeatmapRow: React.FC<{ item: MostPlayedBeatmap }> = ({ item }) => {
    const title = item.beatmapset?.title_unicode || item.beatmapset?.title || 'Unknown';
    const artist = item.beatmapset?.artist_unicode || item.beatmapset?.artist || '';
    const version = item.beatmap.version;
    const creator = item.beatmapset?.creator;
    const cover = item.beatmapset?.covers?.['list@2x'] || item.beatmapset?.covers?.list || item.beatmapset?.covers?.['cover@2x'];
    const url = item.beatmap.url || '#';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded transition-colors">
      {/* Cover */}
      <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-700">
        {cover ? (
          <img src={cover} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
        >
          {title}
        </a>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {artist}{creator && ` — mapped by ${creator}`}
          {version && <span className="text-yellow-600 dark:text-yellow-400 ml-1">[{version}]</span>}
        </div>
      </div>

      {/* Play count */}
      <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex-shrink-0">
        <span className="text-xs">▶</span>
        {item.count.toLocaleString()}
      </div>
    </div>
  );
};

const UserHistorical: React.FC<UserHistoricalProps> = ({ userId, monthlyPlaycounts, className = '' }) => {
  const { profileColor } = useProfileColor();
  const [mostPlayed, setMostPlayed] = useState<MostPlayedBeatmap[]>([]);
  const [loadingMostPlayed, setLoadingMostPlayed] = useState(true);
  const [mostPlayedError, setMostPlayedError] = useState(false);
  const [showAllPlayed, setShowAllPlayed] = useState(false);

    useEffect(() => {
    setLoadingMostPlayed(true);
    setMostPlayedError(false);
    userAPI.getMostPlayedBeatmaps(userId, 10)
        .then(data => {
        if (Array.isArray(data)) setMostPlayed(data);
        else setMostPlayedError(true);
        })
        .catch(() => setMostPlayedError(true))
        .finally(() => setLoadingMostPlayed(false));
    }, [userId]);

  const displayedPlayed = showAllPlayed ? mostPlayed : mostPlayed.slice(0, 5);
  const totalPlays = monthlyPlaycounts.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className={className}>

      {/* Play History */}
      <div className="mb-8">
        <SectionHeader title="Play History" profileColor={profileColor} />
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
          <PlayHistoryChart data={monthlyPlaycounts} color={profileColor} />
        </div>
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-600 text-right">
          {totalPlays.toLocaleString()} total plays across {monthlyPlaycounts.length} months
        </div>
      </div>

      {/* Most Played Beatmaps */}
      <div>
        <SectionHeader title="Most Played Beatmaps" profileColor={profileColor} />

        {loadingMostPlayed && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {mostPlayedError && !loadingMostPlayed && (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            <p>Most played beatmaps unavailable.</p>
            <p className="text-xs mt-1">Add <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/v2/users/&#123;id&#125;/beatmapsets/most_played</code> to your server.</p>
          </div>
        )}

        {!loadingMostPlayed && !mostPlayedError && mostPlayed.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            No beatmap play data yet
          </div>
        )}

        {!loadingMostPlayed && mostPlayed.length > 0 && (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {displayedPlayed.map(item => (
                <MostPlayedBeatmapRow key={item.beatmap_id} item={item} />
              ))}
            </div>

            {mostPlayed.length > 5 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowAllPlayed(v => !v)}
                  className="px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {showAllPlayed ? 'Show less' : `Show more (${mostPlayed.length - 5} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default UserHistorical;