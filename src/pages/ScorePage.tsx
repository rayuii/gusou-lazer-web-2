import React, { useEffect, useRef, useState } from 'react';
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

function pct(n: number) { return `${(n * 100).toFixed(2)}%`; }

// Accuracy donut ring
const AccuracyRing: React.FC<{ rank: string; accuracy: number }> = ({ rank, accuracy }) => {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * accuracy;
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* track */}
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {/* accuracy fill */}
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={gradeColor(rank)} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      {/* grade letter */}
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

// Grade ladder (A B C D)
const GradeLadder: React.FC<{ active: string }> = ({ active }) => {
  const grades = ['A', 'B', 'C', 'D'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 8 }}>
      {grades.map(g => (
        <div key={g} style={{
          width: 28, height: 28, borderRadius: 6,
          background: g === active ? gradeBg(g) : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${g === active ? gradeColor(g) : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          color: g === active ? gradeColor(g) : 'rgba(255,255,255,0.3)',
        }}>
          {g}
        </div>
      ))}
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

  const coverUrl = bms.covers?.cover || bms.covers?.['cover@2x'] || '';
  const submittedAt = score.ended_at ? new Date(score.ended_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  // slider/spinner stats (only show if present)
  const sliderStats = [
    { label: 'SLIDER TICK', value: formatRatio(stats.large_tick_hit, stats.large_tick_miss) },
    { label: 'SLIDER END', value: formatRatio(stats.slider_tail_hit, undefined) },
    { label: 'SPINNER SPIN', value: formatRatio(stats.spinner_spin_count, undefined) },
    { label: 'SPINNER BONUS', value: formatRatio(stats.spinner_bonus, undefined) },
  ].filter(s => s.value !== '—' && s.value !== '0');

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
          {bms.title || '—'}{' '}
          <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>by {bms.artist || '—'}</span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* mode icon placeholder */}
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,105,180,0.3)',
            border: '1.5px solid rgba(255,105,180,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
          }}>●</div>
          {/* star rating */}
          <span style={{
            background: 'rgba(255,215,0,0.15)',
            border: '1px solid rgba(255,215,0,0.4)',
            color: '#ffd700',
            fontSize: 12, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
          }}>
            ★ {Number(bm.difficulty_rating || 0).toFixed(2)}
          </span>
          {/* diff name + mapper */}
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
      }}>
        {/* blurred background */}
        {coverUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${coverUrl})`,
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
          {/* grade ladder */}
          <GradeLadder active={rank} />

          {/* accuracy ring */}
          <AccuracyRing rank={rank} accuracy={accuracy} />

          {/* score info */}
          <div style={{ flex: 1 }}>
            {/* mods */}
            {score.mods && score.mods.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {score.mods.map((mod: any) => (
                  <span key={mod.acronym ?? mod} style={{
                    background: 'rgba(255,160,0,0.2)',
                    border: '1px solid rgba(255,160,0,0.5)',
                    color: '#ffa000', fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {mod.acronym ?? mod}
                  </span>
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
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>

        {/* user card */}
        <Link to={`/users/${user.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            height: '100%',
            position: 'relative',
          }}>
            {/* cover */}
            {user.cover_url && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${user.cover_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'brightness(0.3)',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                />
                <div>
                  {/* country + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {user.country_code && (
                      <img
                        src={`https://flagcdn.com/20x15/${user.country_code.toLowerCase()}.png`}
                        alt={user.country_code}
                        style={{ borderRadius: 2 }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {user.is_online ? (
                      <span style={{ color: '#4caf50' }}>● Online</span>
                    ) : (
                      `Last seen ${user.last_visit ? new Date(user.last_visit).toLocaleDateString() : '—'}`
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {user.is_online ? 'Online' : 'Offline'}
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