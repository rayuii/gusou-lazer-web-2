import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../utils/format';
import { api } from '../../utils/client';

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches ScoreModel with DEFAULT_SCORE_INCLUDES from the backend.

export interface ScoreStatistics {
  great?: number;
  ok?: number;
  meh?: number;
  miss?: number;
  large_tick_hit?: number;
  large_tick_miss?: number;
  small_tick_hit?: number;
  small_tick_miss?: number;
  perfect?: number;
  good?: number;
  ignore_hit?: number;
  ignore_miss?: number;
  slider_tail_hit?: number;
  legacy_combo_increase?: number;
}

export interface ScoreUser {
  id: number;
  username: string;
  country_code: string;
  avatar_url: string;
}

export interface LeaderboardScore {
  id: number;
  user_id: number;
  beatmap_id: number;
  accuracy: number;          // 0.0 – 1.0
  mods: string[];            // ['HD', 'DT', …]
  total_score: number;
  max_combo: number;
  rank: string;              // 'SS', 'S', 'A', 'B', 'C', 'D', 'F'
  passed: boolean;
  pp: number | null;
  ended_at: string;          // ISO datetime
  statistics: ScoreStatistics;
  user: ScoreUser;
  perfect?: boolean;
  // legacy fields (old API version responses)
  count_300?: number;
  count_100?: number;
  count_50?: number;
  count_miss?: number;
}

export interface BeatmapUserScore {
  position: number;
  score: LeaderboardScore;
}

export interface BeatmapScoresResponse {
  scores: LeaderboardScore[];
  user_score: BeatmapUserScore | null;
  score_count: number;
}

export type LeaderboardType = 'global' | 'country' | 'friends';
export type GameMode = 'osu' | 'taiko' | 'fruits' | 'mania';

// ─── API ──────────────────────────────────────────────────────────────────────

export const getBeatmapScores = async (
  beatmapId: number,
  options: {
    mode?: GameMode;
    type?: LeaderboardType;
    mods?: string[];
    limit?: number;
    legacy_only?: boolean;
  } = {}
): Promise<BeatmapScoresResponse> => {
  const params = new URLSearchParams();
  if (options.mode)         params.set('mode', options.mode);
  if (options.type)         params.set('type', options.type);
  if (options.mods?.length) options.mods.forEach((m) => params.append('mods[]', m));
  if (options.limit)        params.set('limit', String(options.limit));
  if (options.legacy_only != null) params.set('legacy_only', String(options.legacy_only));

  const response = await api.get(`/api/v2/beatmaps/${beatmapId}/scores?${params.toString()}`);
  return response.data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  XH: '#e2e8f0', X: '#fbbf24', SH: '#cbd5e1', S: '#34d399',
  A: '#4ade80',  B: '#60a5fa', C: '#a78bfa',  D: '#f87171', F: '#94a3b8',
};

const MOD_COLORS: Record<string, string> = {
  NF: '#6b7280', EZ: '#86efac', HD: '#fbbf24', HR: '#f87171',
  SD: '#fb923c', DT: '#818cf8', HT: '#94a3b8', NC: '#e879f9',
  FL: '#475569', SO: '#fb7185', PF: '#f97316', RX: '#34d399',
  AP: '#4ade80', AT: '#06b6d4', MR: '#f43f5e',
  '4K': '#38bdf8', '5K': '#38bdf8', '6K': '#38bdf8',
  '7K': '#38bdf8', '8K': '#38bdf8', '9K': '#38bdf8',
};

const timeAgo = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)       return `${Math.floor(diff)}s`;
  if (diff < 3600)     return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000)  return `${Math.floor(diff / 86400)}d`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo`;
  return `${Math.floor(diff / 31536000)}y`;
};

/** Normalise hit statistics from either new (statistics obj) or legacy (count_* fields) */
const getStats = (score: LeaderboardScore) => ({
  great: score.statistics?.great ?? score.count_300 ?? 0,
  ok:    score.statistics?.ok    ?? score.count_100 ?? 0,
  meh:   score.statistics?.meh   ?? score.count_50  ?? 0,
  miss:  score.statistics?.miss  ?? score.count_miss ?? 0,
});

const isPerfect = (score: LeaderboardScore) =>
  score.perfect ?? getStats(score).miss === 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

const RankBadge: React.FC<{ letter: string }> = ({ letter }) => (
  <span
    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-black flex-shrink-0"
    style={{
      backgroundColor: `${RANK_COLORS[letter] ?? '#94a3b8'}22`,
      color: RANK_COLORS[letter] ?? '#94a3b8',
      border: `1.5px solid ${RANK_COLORS[letter] ?? '#94a3b8'}55`,
    }}
  >
    {letter}
  </span>
);

const ModChip: React.FC<{ mod: string }> = ({ mod }) => (
  <span
    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none"
    style={{
      backgroundColor: `${MOD_COLORS[mod] ?? '#64748b'}25`,
      color: MOD_COLORS[mod] ?? '#94a3b8',
      border: `1px solid ${MOD_COLORS[mod] ?? '#64748b'}40`,
    }}
  >
    {mod}
  </span>
);

const Flag: React.FC<{ cc: string }> = ({ cc }) => (
  <img
    src={`https://osu.ppy.sh/images/flags/${cc.toUpperCase()}.png`}
    alt={cc}
    className="w-5 h-3.5 object-cover rounded-sm opacity-90 flex-shrink-0"
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
  />
);

const Avatar: React.FC<{ user: ScoreUser; className?: string }> = ({ user, className = 'w-7 h-7' }) =>
  user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt={user.username}
      className={`${className} rounded-md object-cover border border-slate-300 dark:border-slate-600 flex-shrink-0`}
    />
  ) : (
    <div className={`${className} rounded-md bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 flex-shrink-0`}>
      {user.username[0]?.toUpperCase()}
    </div>
  );

// ─── #1 Hero Card ─────────────────────────────────────────────────────────────

const TopScoreCard: React.FC<{ score: LeaderboardScore }> = ({ score }) => {
  const stats = getStats(score);
  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl overflow-hidden bg-gradient-to-r from-slate-700/60 to-slate-800/40 border border-osu-pink/20">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-osu-pink/80 w-8 text-center select-none">#1</span>
          <div className="relative">
            <Avatar user={score.user} className="w-12 h-12" />
            <div className="absolute -bottom-1 -right-1">
              <RankBadge letter={score.rank} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flag cc={score.user.country_code} />
              <span className="font-bold text-white text-sm">{score.user.username}</span>
            </div>
            <span className="text-slate-400 text-xs">{timeAgo(score.ended_at)} ago</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'SCORE',     value: formatNumber(score.total_score),          color: 'text-white' },
            { label: 'ACCURACY',  value: `${(score.accuracy * 100).toFixed(2)}%`,  color: 'text-green-400' },
            { label: 'MAX COMBO', value: `${formatNumber(score.max_combo)}x`,      color: 'text-osu-pink' },
            { label: 'PP',        value: score.pp != null ? score.pp.toFixed(2) : '—', color: 'text-yellow-400' },
            { label: 'GREAT',     value: stats.great,                              color: 'text-blue-400' },
            { label: 'MISS',      value: stats.miss, color: stats.miss > 0 ? 'text-red-400' : 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`text-base font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Mods */}
        {score.mods.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
            {score.mods.map((m) => <ModChip key={m} mod={m} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const TYPES: { value: LeaderboardType; label: string }[] = [
  { value: 'global',  label: 'Global' },
  { value: 'country', label: 'Country' },
  { value: 'friends', label: 'Friends' },
];

const FilterBar: React.FC<{
  type: LeaderboardType;
  onChange: (t: LeaderboardType) => void;
}> = ({ type, onChange }) => (
  <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
    {TYPES.map((t) => (
      <button
        key={t.value}
        onClick={() => onChange(t.value)}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          type === t.value
            ? 'bg-osu-pink text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-osu-pink hover:bg-osu-pink/10'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface BeatmapLeaderboardProps {
  beatmapId: number;
  mode?: GameMode;
}

const BeatmapLeaderboard: React.FC<BeatmapLeaderboardProps> = ({ beatmapId, mode = 'osu' }) => {
  const { t } = useTranslation();
  const [data, setData]       = useState<BeatmapScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lbType, setLbType]   = useState<LeaderboardType>('global');

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBeatmapScores(beatmapId, { mode, type: lbType, limit: 50 });
      setData(result);
    } catch (e: any) {
      setError(e.message || t('beatmap.errorLoadingScores', 'Failed to load scores'));
    } finally {
      setLoading(false);
    }
  }, [beatmapId, mode, lbType, t]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const scores    = data?.scores ?? [];
  const userScore = data?.user_score ?? null;

  const TABLE_COLS = [
    { label: 'RANK',      cls: 'w-14 text-center' },
    { label: 'SCORE',     cls: 'text-right' },
    { label: 'ACCURACY',  cls: 'text-right' },
    { label: 'PLAYER',    cls: 'text-left min-w-[140px]' },
    { label: 'MAX COMBO', cls: 'text-right' },
    { label: 'GREAT',     cls: 'text-right' },
    { label: 'OK',        cls: 'text-right' },
    { label: 'MEH',       cls: 'text-right' },
    { label: 'MISS',      cls: 'text-right' },
    { label: 'PP',        cls: 'text-right' },
    { label: 'TIME',      cls: 'text-right' },
    { label: 'MODS',      cls: 'text-right min-w-[80px]' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-osu-pink">●</span>
          {t('beatmap.leaderboard', 'Leaderboard')}
          {data && (
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({formatNumber(data.score_count)})
            </span>
          )}
        </h2>
      </div>

      {/* Filters */}
      <FilterBar type={lbType} onChange={setLbType} />

      {/* Current user's score (if not in top 50) */}
      {!loading && userScore && !scores.some((s) => s.id === userScore.score.id) && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-osu-pink/10 border border-osu-pink/30 flex items-center gap-3 text-sm">
          <span className="text-osu-pink font-bold">#{userScore.position}</span>
          <Avatar user={userScore.score.user} />
          <Flag cc={userScore.score.user.country_code} />
          <span className="font-medium text-slate-900 dark:text-white">{userScore.score.user.username}</span>
          <span className="ml-auto text-slate-500 dark:text-slate-400 tabular-nums">
            {formatNumber(userScore.score.total_score)}
            {' · '}
            {(userScore.score.accuracy * 100).toFixed(2)}%
            {userScore.score.pp != null && ` · ${userScore.score.pp.toFixed(2)}pp`}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-osu-pink" />
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchScores}
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-osu-pink/10 hover:text-osu-pink transition-colors"
          >
            Retry
          </button>
        </div>
      ) : scores.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          {t('beatmap.noScores', 'No scores yet. Be the first!')}
        </div>
      ) : (
        <>
          {/* #1 Hero */}
          <TopScoreCard score={scores[0]} />

          {/* Table */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30">
                  {TABLE_COLS.map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`px-3 py-2.5 text-[10px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {scores.map((score, idx) => {
                  const stats        = getStats(score);
                  const pos          = idx + 1;
                  const isFirst      = pos === 1;
                  const isCurrentUser = score.id === userScore?.score.id;

                  return (
                    <tr
                      key={score.id}
                      className={`transition-colors group ${
                        isCurrentUser
                          ? 'bg-osu-pink/5 dark:bg-osu-pink/[0.07]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      {/* # */}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${isFirst ? 'text-osu-pink' : 'text-slate-500 dark:text-slate-400'}`}>
                          #{pos}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <RankBadge letter={score.rank} />
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatNumber(score.total_score)}
                          </span>
                        </div>
                      </td>

                      {/* Accuracy */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-green-500 dark:text-green-400 font-medium tabular-nums">
                          {(score.accuracy * 100).toFixed(2)}%
                        </span>
                      </td>

                      {/* Player */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={score.user} />
                          <Flag cc={score.user.country_code} />
                          <span className="font-medium text-slate-900 dark:text-white group-hover:text-osu-pink transition-colors cursor-pointer truncate max-w-[120px]">
                            {score.user.username}
                          </span>
                        </div>
                      </td>

                      {/* Max Combo */}
                      <td className="px-3 py-3 text-right">
                        <span className={`font-medium tabular-nums ${isPerfect(score) ? 'text-osu-pink' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatNumber(score.max_combo)}x
                          {isPerfect(score) && <span className="ml-0.5 text-[10px] opacity-60">✓</span>}
                        </span>
                      </td>

                      {/* Hit stats */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-blue-500 dark:text-blue-400 tabular-nums">{stats.great}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-green-500 dark:text-green-400 tabular-nums">{stats.ok}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">{stats.meh}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`tabular-nums font-medium ${stats.miss > 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {stats.miss}
                        </span>
                      </td>

                      {/* PP */}
                      <td className="px-3 py-3 text-right">
                        {score.pp != null
                          ? <span className="text-yellow-500 dark:text-yellow-400 font-semibold tabular-nums">{score.pp.toFixed(2)}</span>
                          : <span className="text-slate-400 dark:text-slate-500">—</span>
                        }
                      </td>

                      {/* Time */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          {timeAgo(score.ended_at)}
                        </span>
                      </td>

                      {/* Mods */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {score.mods.length > 0
                            ? score.mods.map((m) => <ModChip key={m} mod={m} />)
                            : <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BeatmapLeaderboard;