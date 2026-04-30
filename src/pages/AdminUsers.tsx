import React, { useEffect, useState } from 'react';
import { useAdminUsers } from '../hooks/useAdmin';
import {
  AdminTable, GroupBadge, StatusDot, ActionBtn,
  SearchBar, AdminSelect, PageHeader, AvatarCell,
} from '../components/Admin/AdminUI';
import { adminAPI, type AdminUser, type AdminGameMode } from '../utils/adminAPI';
import { RiCloseLine, RiRefreshLine, RiShieldLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import type { AdminUserStatus } from '../types/admin';
import type { GameMode } from '../types';

// ── Player detail slide-over ─────────────────────────────────────────────────

const PlayerDetail: React.FC<{
  userId: number;
  onClose: () => void;
  onAction: () => void;
}> = ({ userId, onClose, onAction }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [punishReason, setPunishReason] = useState('');
  const [mode, setMode] = useState<AdminGameMode>('osu');

  useEffect(() => {
    adminAPI.getUser(userId)
      .then(setUser)
      .catch(() => toast.error('Failed to load player'))
      .finally(() => setLoading(false));
  }, [userId]);

  const stats = user?.statistics_rulesets?.[mode as GameMode] ?? user?.statistics;

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      onAction();
      setLoading(true);
      const fresh = await adminAPI.getUser(userId);
      setUser(fresh);
    } catch {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-[480px] max-w-full h-full bg-gray-900 border-l border-gray-800 overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <p className="font-semibold text-gray-100">Player detail</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-100 transition-colors">
            <RiCloseLine size={20} />
          </button>
        </div>

        {loading && (
          <div className="py-16 text-center text-gray-600">Loading…</div>
        )}

        {!loading && user && (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-16 h-16 rounded-xl object-cover bg-gray-800"
              />
              <div>
                <div className="flex items-center flex-wrap gap-1 mb-1">
                  <span className="text-lg font-semibold text-gray-100">{user.username}</span>
                  {user.groups?.map(g => (
                    <GroupBadge key={g.id} short={g.short_name} colour={g.colour} />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  ID: {user.id} · {user.country?.name ?? user.country_code}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Joined {new Date(user.join_date).toLocaleDateString()}
                  {user.last_visit && ` · Last seen ${new Date(user.last_visit).toLocaleDateString()}`}
                </p>
                <div className="flex gap-2 mt-1">
                  {user.is_restricted && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-red-800 bg-red-900/30 text-red-300">
                      Restricted
                    </span>
                  )}
                  {user.is_silenced && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-amber-800 bg-amber-900/30 text-amber-300">
                      Silenced
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mode selector */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Game mode</p>
              <div className="flex gap-1.5">
                {(['osu', 'taiko', 'fruits', 'mania'] as AdminGameMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                      ${mode === m
                        ? 'bg-osu-pink/15 border-osu-pink/30 text-osu-pink'
                        : 'border-gray-800 text-gray-500 hover:text-gray-100'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Global rank',    v: stats.global_rank  ? `#${stats.global_rank.toLocaleString()}`  : '—' },
                  { l: 'Country rank',   v: stats.country_rank ? `#${stats.country_rank.toLocaleString()}` : '—' },
                  { l: 'PP',             v: `${Math.round(stats.pp).toLocaleString()}pp` },
                  { l: 'Ranked score',   v: stats.ranked_score.toLocaleString() },
                  { l: 'Accuracy',       v: `${stats.hit_accuracy.toFixed(2)}%` },
                  { l: 'Play count',     v: stats.play_count.toLocaleString() },
                  { l: 'Total score',    v: stats.total_score.toLocaleString() },
                  { l: 'Total hits',     v: stats.total_hits.toLocaleString() },
                  { l: 'Max combo',      v: stats.maximum_combo.toLocaleString() },
                ].map(item => (
                  <div key={item.l} className="bg-gray-800/60 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-500 mb-0.5">{item.l}</p>
                    <p className="text-sm font-medium text-gray-100">{item.v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Grade counts */}
            {stats?.grade_counts && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Grade counts</p>
                <div className="flex gap-2">
                    {Object.entries(stats.grade_counts).map(([grade, count]) => (
                    <div key={grade} className="text-center">
                        <p className="text-xs text-gray-400 uppercase font-mono">{grade}</p>
                        <p className="text-sm font-semibold text-gray-100">{count as number}</p>
                    </div>
                    ))}
                </div>
              </div>
            )}

            {/* Admin actions */}
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Admin actions</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <ActionBtn
                  size="sm"
                    onClick={() => handleAction(async () => {
                    const r = await adminAPI.resetUserPassword(user.id);
                    toast.success(`Temp password: ${r.temp_password}`, { duration: 15_000 });
                    })}
                >
                  Reset password
                </ActionBtn>
                <ActionBtn size="sm" onClick={() => handleAction(async () => await adminAPI.recalcUserPP(user.id, mode))}>
                  Recalc PP
                </ActionBtn>
                {user.is_restricted ? (
                  <ActionBtn
                    size="sm"
                    variant="success"
                    onClick={() => handleAction(async () => await adminAPI.unrestrictUser(user.id))}
                  >
                    Lift restriction
                  </ActionBtn>
                ) : (
                  <ActionBtn
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (!punishReason) { toast.error('Enter a reason first'); return; }
                      handleAction(async () => await adminAPI.restrictUser(user.id, punishReason));
                    }}
                  >
                    Restrict
                  </ActionBtn>
                )}
                <ActionBtn
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (!punishReason) { toast.error('Enter a reason first'); return; }
                    handleAction(async () => await adminAPI.wipeUserScores(user.id, mode));
                  }}
                >
                  Wipe scores ({mode})
                </ActionBtn>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Reason (required for destructive actions)</p>
                <textarea
                  value={punishReason}
                  onChange={e => setPunishReason(e.target.value)}
                  placeholder="Internal note — not shown to player"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2
                             placeholder:text-gray-600 focus:outline-none focus:border-osu-pink/50 resize-none"
                />
              </div>

              {/* Issue punishment form */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Issue punishment</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    id="punish-action"
                    className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2
                               focus:outline-none focus:border-osu-pink/50"
                  >
                    <option value="silence">Silence</option>
                    <option value="restriction">Restriction</option>
                    <option value="ban">Ban</option>
                    <option value="score_wipe">Score wipe</option>
                    <option value="rank_reset">Rank reset</option>
                  </select>
                  <input
                    id="punish-duration"
                    type="text"
                    placeholder="Duration (e.g. 7d)"
                    className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2
                               placeholder:text-gray-600 focus:outline-none focus:border-osu-pink/50"
                  />
                </div>
                <button
                  onClick={() => {
                    const action = (document.getElementById('punish-action') as HTMLSelectElement).value;
                    const duration = (document.getElementById('punish-duration') as HTMLInputElement).value;
                    if (!punishReason) { toast.error('Enter a reason first'); return; }
                    handleAction(async () => await adminAPI.issuePunishment({
                      user_id: user.id,
                      action: action as Parameters<typeof adminAPI.issuePunishment>[0]['action'],
                      duration: duration || undefined,
                      reason: punishReason,
                      send_notification: true,
                    }));
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-osu-pink/15 border border-osu-pink/30
                             text-osu-pink text-sm font-medium rounded-lg py-2 hover:bg-osu-pink/25 transition-colors"
                >
                  <RiShieldLine />
                  Apply punishment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const AdminUsers: React.FC = () => {
  const {
    users, total, loading,
    query, setQuery,
    status, setStatus,
    page, setPage,
    refresh,
  } = useAdminUsers();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Player management';
  }, []);

  const STATUS_OPTIONS = [
    { value: 'all',        label: 'All players'  },
    { value: 'online',     label: 'Online'        },
    { value: 'restricted', label: 'Restricted'    },
    { value: 'silenced',   label: 'Silenced'      },
    { value: 'banned',     label: 'Banned'        },
  ];

  return (
    <div>
      <PageHeader
        title="Player management"
        sub={`${total.toLocaleString()} total players`}
        actions={
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100
                       border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RiRefreshLine />
            Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search username, ID, country…"
        />
        <AdminSelect
          value={status}
          onChange={v => setStatus(v as AdminUserStatus)}
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Table */}
      <AdminTable
        loading={loading}
        cols={['', '#', 'Player', 'Country', 'PP', 'Accuracy', 'Plays', 'Score', 'Status', '']}
      >
        {users.map((u, i) => (
          <tr
            key={u.id}
            className={`hover:bg-gray-800/40 transition-colors cursor-pointer
                        ${u.is_restricted ? 'bg-red-950/20' : ''}`}
            onClick={() => setSelectedId(u.id)}
          >
            <td className="px-4 py-2.5">
              <StatusDot status={u.is_restricted ? 'offline' : u.is_active ? 'online' : 'idle'} />
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-500">
              #{(u.statistics?.global_rank ?? (i + 1)).toLocaleString()}
            </td>
            <td className="px-4 py-2.5">
              <AvatarCell url={u.avatar_url} username={u.username} />
              {u.groups?.map(g => (
                <GroupBadge key={g.id} short={g.short_name} colour={g.colour} />
              ))}
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-400">
              {u.country?.name ?? u.country_code}
            </td>
            <td className="px-4 py-2.5 text-xs text-osu-pink font-medium">
              {u.statistics?.pp ? `${Math.round(u.statistics.pp).toLocaleString()}pp` : '—'}
            </td>
            <td className="px-4 py-2.5 text-xs text-emerald-400">
              {u.statistics?.hit_accuracy != null
                ? `${u.statistics.hit_accuracy.toFixed(2)}%`
                : '—'}
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-400">
              {u.statistics?.play_count?.toLocaleString() ?? '—'}
            </td>
            <td className="px-4 py-2.5 text-xs text-gray-400">
              {u.statistics?.ranked_score?.toLocaleString() ?? '—'}
            </td>
            <td className="px-4 py-2.5">
              {u.is_restricted && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-800 bg-red-900/30 text-red-300">
                  Restricted
                </span>
              )}
              {u.is_silenced && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-800 bg-amber-900/30 text-amber-300">
                  Silenced
                </span>
              )}
            </td>
            <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
              <ActionBtn onClick={() => setSelectedId(u.id)}>View →</ActionBtn>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {Math.min(50, total - (page - 1) * 50)} of {total.toLocaleString()}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-gray-800 disabled:opacity-40
                         transition-colors text-gray-300"
            >
              ← Prev
            </button>
            <button
              disabled={page * 50 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-gray-800 disabled:opacity-40
                         transition-colors text-gray-300"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedId != null && (
        <PlayerDetail
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={refresh}
        />
      )}
    </div>
  );
};

export default AdminUsers;