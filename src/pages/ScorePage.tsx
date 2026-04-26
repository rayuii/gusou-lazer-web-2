import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scoreAPI } from '../utils/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const gradeColor = (rank: string) => {
  const map: Record<string, string> = {
    XH: '#b0c4de', X: '#ffd700', SH: '#b0c4de', S: '#ffd700',
    A: '#4caf50', B: '#2196f3', C: '#ff9800', D: '#f44336', F: '#666',
  };
  return map[rank] ?? '#fff';
};

const gradeBg = (rank: string) => {
  const map: Record<string, string> = {
    XH: 'rgba(176,196,222,0.15)', X: 'rgba(255,215,0,0.15)',
    SH: 'rgba(176,196,222,0.15)', S: 'rgba(255,215,0,0.15)',
    A: 'rgba(76,175,80,0.15)', B: 'rgba(33,150,243,0.15)',
    C: 'rgba(255,152,0,0.15)', D: 'rgba(244,67,54,0.15)', F: 'rgba(100,100,100,0.15)',
  };
  return map[rank] ?? 'rgba(255,255,255,0.1)';
};

function formatRatio(a: number | undefined, b: number | undefined): string {
  if (a === undefined || a === null) return '—';
  if (b !== undefined && b !== null) return `${a}/${a + b}`;
  return String(a);
}

/** Map osu! rank letter → SVG filename in /assets/images/grades/ */
function gradeFilename(rank: string): string {
  const map: Record<string, string> = {
    XH: 'SS-Silver', X: 'SS',
    SH: 'S-Silver', S: 'S',
    A: 'A', B: 'B', C: 'C', D: 'D', F: 'F',
  };
  return map[rank] ?? rank;
}

function pct(n: number) { return `${(n * 100).toFixed(2)}%`; }

/**
 * Convert a country_code like "CA" → the osu! flag emoji SVG URL.
 * osu! uses unicode flag emoji sequences joined as hex codepoints.
 * e.g. "CA" → 🇨🇦 → U+1F1E8 U+1F1E6 → "1f1e8-1f1e6"
 */
function countryFlagUrl(code: string): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1F1E6 - 'A'.charCodeAt(0);
  const a = (base + code.charCodeAt(0)).toString(16);
  const b = (base + code.charCodeAt(1)).toString(16);
  return `https://osu.ppy.sh/assets/images/flags/${a}-${b}.svg`;
}

// Accuracy donut ring — rank letter in center
const AccuracyRing: React.FC<{ rank: string; accuracy: number }> = ({ rank, accuracy }) => {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * accuracy;
  const cx = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={gradeColor(rank)} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span style={{
        fontSize: 72, fontWeight: 900, color: gradeColor(rank),
        textShadow: `0 0 30px ${gradeColor(rank)}88`,
        lineHeight: 1,
      }}>
        {rank}
      </span>
    </div>
  );
};

// Grade ladder — SS/S/A/B/C/D, silver variants when HD/FL active
const GradeLadder: React.FC<{ active: string; hasSilver?: boolean }> = ({ active, hasSilver }) => {
  // Map display grade → actual rank code (silver if HD)
  const displayGrades = ['SS', 'S', 'A', 'B', 'C', 'D'];
  const toRankCode = (g: string) => {
    if (hasSilver && g === 'SS') return 'XH';
    if (hasSilver && g === 'S') return 'SH';
    if (g === 'SS') return 'X';
    return g;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 8 }}>
      {displayGrades.map(g => {
        const rankCode = toRankCode(g);
        const isActive = rankCode === active || g === active;
        return (
          <div key={g} style={{
            width: 38, height: 24, borderRadius: 5,
            background: isActive ? gradeBg(rankCode) : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${isActive ? gradeColor(rankCode) : 'rgba(255,255,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img
              src={`../image/grades/${gradeFilename(rankCode)}.svg`}
              alt={g}
              style={{
                width: 28, height: 18, objectFit: 'contain',
                opacity: isActive ? 1 : 0.5,
                filter: isActive ? `drop-shadow(0 0 4px ${gradeColor(rankCode)}88)` : 'grayscale(0.3)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// Acronym → osu! mod SVG filename mapping
const MOD_FILENAMES: Record<string, string> = {
  // Difficulty Reduction
  EZ: 'mod-easy',
  NF: 'mod-no-fail',
  HT: 'mod-half-time',
  DC: 'mod-daycore',
  // Difficulty Increase
  HR: 'mod-hard-rock',
  SD: 'mod-sudden-death',
  PF: 'mod-perfect',
  DT: 'mod-double-time',
  NC: 'mod-nightcore',
  HD: 'mod-hidden',
  FL: 'mod-flashlight',
  AC: 'mod-accuracy-challenge',
  // Automation
  RX: 'mod-relax',
  AP: 'mod-autopilot',
  AT: 'mod-autoplay',
  CN: 'mod-cinema',
  // Conversion
  MR: 'mod-mirror',
  RD: 'mod-random',
  AL: 'mod-alternate',
  SG: 'mod-single-tap',
  // Fun
  BL: 'mod-blinds',
  ST: 'mod-strict-tracking',
  DP: 'mod-depth',
  TC: 'mod-target-practice',
  BR: 'mod-barrel-roll',
  AD: 'mod-approach-different',
  MU: 'mod-muted',
  NS: 'mod-no-scope',
  MB: 'mod-magnetised',
  // System
  SO: 'mod-spun-out',
  TR: 'mod-transform',
  WG: 'mod-wiggle',
  SI: 'mod-wind-up',
  WD: 'mod-wind-down',
  GR: 'mod-grow',
  DF: 'mod-deflate',
  FR: 'mod-freeze-frame',
  BU: 'mod-bubbles',
  SY: 'mod-synesthesia',
  CL: 'mod-classic',
  SV2: 'mod-scroll-speed',
  AS: 'mod-adaptive-speed',
  CS: 'mod-constant-speed',
  // Mania specific
  '1K': 'mod-one-key', '2K': 'mod-two-keys', '3K': 'mod-three-keys',
  '4K': 'mod-four-keys', '5K': 'mod-five-keys', '6K': 'mod-six-keys',
  '7K': 'mod-seven-keys', '8K': 'mod-eight-keys', '9K': 'mod-nine-keys',
  '10K': 'mod-ten-keys',
  DS: 'mod-dual-stages',
  FI: 'mod-fade-in',
  CO: 'mod-cover',
  HO: 'mod-hold-off',
  IN: 'mod-invert',
};

const ModIcon: React.FC<{ mod: any }> = ({ mod }) => {
  const acronym: string = mod?.acronym ?? mod ?? '??';
  const filename = MOD_FILENAMES[acronym];

  if (filename) {
    return (
      <img
        src={`../image/mods/${filename}.svg`}
        alt={acronym}
        title={acronym}
        style={{ height: 32, width: 'auto', objectFit: 'contain' }}
        onError={(e) => {
          // fall back to painted blank icon
          (e.currentTarget as HTMLImageElement).src = 'image/mods/blanks/mod-icon.svg';
          (e.currentTarget as HTMLImageElement).style.filter = 'hue-rotate(30deg) saturate(2)';
        }}
      />
    );
  }

  // Unknown mod — blank icon with label overlay
  return (
    <div style={{ position: 'relative', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="../image/mods/blanks/mod-icon.svg" alt={acronym} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
      <span style={{
        position: 'absolute', fontSize: 9, fontWeight: 900, color: '#fff',
        letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1,
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}>{acronym}</span>
    </div>
  );
};

// Single stat cell
const StatCell: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: '10px 14px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: accent ? '#66ccff' : '#fff' }}>
      {value}
    </div>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const ScorePage: React.FC = () => {
  const { scoreId } = useParams<{ scoreId: string }>();
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!scoreId) return;
    scoreAPI.getScore(parseInt(scoreId))
      .then(setScore)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [scoreId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
        <div style={{ opacity: 0.5 }}>Loading score…</div>
      </div>
    </div>
  );

  if (error || !score) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💔</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Score not found</div>
        <div style={{ opacity: 0.5, marginTop: 4 }}>Score #{scoreId} doesn't exist or was deleted.</div>
      </div>
    </div>
  );

  const bm = score.beatmap ?? {};
  const bms = score.beatmapset ?? {};
  const user = score.user ?? {};
  const stats = score.statistics ?? {};
  const rank = score.rank ?? 'F';
  const accuracy = score.accuracy ?? 0;
  const pp = score.pp ? Math.round(score.pp) : null;
  const ppFc = score.pp_fc ? Math.round(score.pp_fc) : null;

  // Cover: prefer beatmapset cover, fall back to list cover
  const coverUrl =
    bms.covers?.cover ||
    bms.covers?.['cover@2x'] ||
    bms.covers?.list ||
    bms.covers?.['list@2x'] ||
    (bms.id ? `https://assets.ppy.sh/beatmaps/${bms.id}/covers/cover.jpg` : '');

  // User profile cover (shown as card background)
  const userCoverUrl = user.cover?.url || user.cover_url || '';

  const submittedAt = score.ended_at ? new Date(score.ended_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  const beatmapUrl = bm.id
    ? `/beatmapsets/${bms.id ?? ''}#osu/${bm.id}`
    : undefined;

  const sliderStats = [
    { label: 'SLIDER TICK', value: formatRatio(stats.large_tick_hit, stats.large_tick_miss) },
    { label: 'SLIDER END', value: formatRatio(stats.slider_tail_hit, undefined) },
    { label: 'SPINNER SPIN', value: formatRatio(stats.spinner_spin_count, undefined) },
    { label: 'SPINNER BONUS', value: formatRatio(stats.spinner_bonus, undefined) },
  ].filter(s => s.value !== '—' && s.value !== '0');

  const flagUrl = countryFlagUrl(user.country_code ?? user.country?.code ?? '');
  const teamFlagUrl = user.team?.flag_url ?? '';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', fontFamily: 'inherit' }}>

      {/* ── beatmap header ── */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px 12px 0 0',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
          {beatmapUrl ? (
            <Link to={beatmapUrl} style={{ color: '#fff', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {bms.title || '—'}
            </Link>
          ) : (bms.title || '—')}
          {' '}
          <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>by {bms.artist || '—'}</span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,105,180,0.3)',
            border: '1.5px solid rgba(255,105,180,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
          }}>●</div>
          <span style={{
            background: 'rgba(255,215,0,0.15)',
            border: '1px solid rgba(255,215,0,0.4)',
            color: '#ffd700',
            fontSize: 12, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
          }}>
            ★ {Number(bm.difficulty_rating || 0).toFixed(2)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {bm.version || '—'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            mapped by{' '}
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{bms.creator || '—'}</span>
          </span>
        </div>
      </div>

      {/* ── main score area ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 12px 12px',
        marginBottom: 16,
        minHeight: 280,
        background: '#111', // ensure something shows even if cover fails
      }}>
        {/* blurred background */}
        {coverUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("${coverUrl}")`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(2px) brightness(0.35)',
              transform: 'scale(1.05)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
            }} />
          </>
        )}

        <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <GradeLadder active={rank} hasSilver={score.mods?.some((m: any) => (m?.acronym ?? m) === 'HD' || (m?.acronym ?? m) === 'FL')} />
          <AccuracyRing rank={rank} accuracy={accuracy} />

          <div style={{ flex: 1 }}>
            {/* mods */}
            {score.mods && score.mods.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {score.mods.map((mod: any, i: number) => (
                  <ModIcon key={mod?.acronym ?? i} mod={mod} />
                ))}
              </div>
            )}

            {/* big score */}
            <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>
              {score.total_score?.toLocaleString() ?? '—'}
            </div>

            {/* meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Played by</span>
              <Link to={`/users/${user.id}`} style={{ color: '#66ccff', textDecoration: 'none', fontWeight: 600 }}>
                {user.username ?? '—'}
              </Link>

              {score.replay_watch_count !== undefined && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>Watched</span>
                  <span style={{ color: '#fff' }}>{score.replay_watch_count} times</span>
                </>
              )}

              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Submitted on</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{submittedAt}</span>

              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Played on</span>
              <span style={{ color: '#fff' }}>{score.build_id ? 'Lazer' : 'Stable'}</span>
            </div>

            {/* global rank */}
            {score.rank_global && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
                  GLOBAL RANK
                </div>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  padding: '3px 14px',
                  fontSize: 22, fontWeight: 800, color: '#fff',
                }}>
                  #{score.rank_global}
                </div>
              </div>
            )}
          </div>

          {/* download replay */}
          <div style={{ alignSelf: 'flex-end', paddingBottom: 4 }}>
            <a
              href={`/api/v2/scores/${scoreId}/download`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #00b4cc, #0088aa)',
                color: '#fff', textDecoration: 'none',
                padding: '10px 20px', borderRadius: 24,
                fontWeight: 700, fontSize: 14,
                boxShadow: '0 4px 20px rgba(0,180,204,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              ↓ Download Replay
            </a>
          </div>
        </div>
      </div>

      {/* ── bottom: user card + stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12, alignItems: 'start' }}>

        {/* user card */}
        <Link to={`/users/${user.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}>
            {/* user profile cover as background */}
            {userCoverUrl && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("${userCoverUrl}")`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'brightness(0.3)',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flexShrink: 0, width: 44, height: 44 }}>
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: -5, left: -5,
                    width: 14, height: 14, borderRadius: '50%',
                    border: `2.5px solid ${user.is_online ? '#4caf50' : '#666'}`,
                    background: '#1a1a1a',
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  {/* flags row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    {flagUrl && (
                      <img
                        src={flagUrl}
                        alt={user.country_code ?? ''}
                        title={user.country?.name ?? user.country_code}
                        style={{ width: 18, height: 13, borderRadius: 2, objectFit: 'cover' }}
                      />
                    )}
                    {teamFlagUrl && (
                      <img
                        src={teamFlagUrl}
                        alt={user.team?.short_name ?? ''}
                        title={user.team?.name ?? ''}
                        style={{ height: 15, maxWidth: 34, objectFit: 'contain', borderRadius: 2 }}
                      />
                    )}
                    {user.is_supporter && (
                      <span style={{ fontSize: 12, lineHeight: 1 }}>💗</span>
                    )}
                  </div>
                  {/* username */}
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{user.username}</div>
                  {/* last seen */}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {user.is_online ? 'Online' : `Last seen ${user.last_visit ? new Date(user.last_visit).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {user.is_online ? '' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* row 1: accuracy / combo / pp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatCell label="ACCURACY" value={pct(accuracy)} />
            <StatCell label="MAX COMBO" value={`${score.max_combo ?? 0}x`} />
            <StatCell
              label="PP"
              value={pp !== null ? (
                <span>
                  {pp}
                  {ppFc && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginLeft: 4 }}>({ppFc} if FC)</span>}
                </span>
              ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>—</span>}
              accent
            />
          </div>

          {/* row 2: great ok meh miss */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <StatCell label="GREAT" value={stats.great ?? stats.count_300 ?? 0} />
            <StatCell label="OK" value={stats.ok ?? stats.count_100 ?? 0} />
            <StatCell label="MEH" value={stats.meh ?? stats.count_50 ?? 0} />
            <StatCell label="MISS" value={stats.miss ?? stats.count_miss ?? 0} />
          </div>

          {/* row 3: slider/spinner (conditional) */}
          {sliderStats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sliderStats.length}, 1fr)`, gap: 8 }}>
              {sliderStats.map(s => (
                <StatCell key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ScorePage;