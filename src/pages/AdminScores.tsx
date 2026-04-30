import React, { useEffect, useState } from 'react';
import { useAdminScores } from '../hooks/useAdmin';
import {
  AdminTable, AdminSelect, PageHeader, ActionBtn,
} from '../components/Admin/AdminUI';
import { type AdminGameMode } from '../utils/adminAPI';
import toast from 'react-hot-toast';

type ScoreType = 'top' | 'recent' | 'flagged';

const RANK_COLORS: Record<string, string> = {
  SSH: 'text-cyan-300', SS: 'text-yellow-300',
  SH: 'text-cyan-400',  S:  'text-yellow-400',
  A:  'text-emerald-400', B: 'text-blue-400',
  C:  'text-orange-400',  D: 'text-red-400',
  F:  'text-gray-500',
};

const AdminScores: React.FC = () => {
  const [type, setType]   = useState<ScoreType>('top');
  const [mode, setMode]   = useState<AdminGameMode>('osu');
  const [reason, setReason] = useState('');

  const { scores, loading, deleteScore, refresh: _refresh } = useAdminScores(type, mode);

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Score browser';
  }, []);

  const handleDelete = async (id: number) => {
    if (!reason) { toast.error('Enter a reason before deleting'); return; }
    if (!confirm('Delete this score? This cannot be undone.')) return;
    await deleteScore(id, reason);
  };

  const TYPE_TABS: { value: ScoreType; label: string }[] = [
    { value: 'top',     label: 'Top scores' },
    { value: 'recent',  label: 'Recent'     },
    { value: 'flagged', label: 'Flagged'    },
  ];

  const MODE_OPTIONS: { value: AdminGameMode; label: string }[] = [
    { value: 'osu',   label: 'osu!' },
    { value: 'taiko', label: 'taiko' },
    { value: 'fruits', label: 'catch' },
    { value: 'mania', label: 'mania' },
  ];

  return (
    <div>
      <PageHeader title="Score browser" sub="Inspect, verify, and delete scores" />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {TYPE_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors
                ${type === t.value
                  ? 'bg-osu-pink/15 text-osu-pink border border-osu-pink/20'
                  : 'text-gray-500 hover:text-gray-100'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <AdminSelect value={mode} onChange={v => setMode(v as AdminGameMode)} options={MODE_OPTIONS} />
        <input
          type="text"
          placeholder="Delete reason (required)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="flex-1 max-w-xs bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg
                     px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-osu-pink/50"
        />
      </div>

      <AdminTable
        loading={loading}
        cols={['#', 'Beatmap', 'Player', 'Rank', 'Accuracy', 'PP', 'Combo', 'Mods', 'Date', '']}
      >
        {scores.map((score, i) => (
          <tr
            key={score.id}
            className={`hover:bg-gray-800/40 transition-colors
                        ${score.flagged ? 'bg-red-950/15' : ''}`}
          >
            <td className="px-4 py-2.5 text-xs text-gray-500">{i + 1}</td>
            <td className="px-4 py-2.5">
              <p className="text-sm font-medium text-gray-100">
                {score.beatmapset?.artist} — {score.beatmapset?.title}
              </p>
              <p className="text-xs text-gray-500">
                [{score.beatmap?.version}] {score.beatmap?.difficulty_rating?.toFixed(2)}★
              </p>
            </td>
            <td className="px-4 py-2.5 text-sm text-osu-pink">{score.username ?? `#${score.user_id}`}</td>
            <td className="px-4 py-2.5">
              <span className={`text-sm font-bold ${RANK_COLORS[score.rank] ?? 'text-gray-400'}`}>
                {score.rank}
              </span>
            </td>
            <td className="px-4 py-2.5 text-xs text-emerald-400">
              {(score.accuracy * 100).toFixed(2)}%
            </td>
            <td className="px-4 py-2.5 text-xs text-osu-pink font-medium">
              {score.pp != null ? `${Math.round(score.pp)}pp` : '—'}
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-400">
              {score.max_combo.toLocaleString()}x
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-500">
              {score.mods.length > 0 ? score.mods.join(' ') : 'NM'}
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-600">
              {new Date(score.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-2.5">
              <ActionBtn variant="danger" onClick={() => handleDelete(score.id)}>
                Delete
              </ActionBtn>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
};

export default AdminScores;