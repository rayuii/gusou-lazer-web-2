import React, { useEffect, useState } from 'react';
import { useAdminReports, useAdminBans } from '../../hooks/useAdmin';
import { adminAPI, type PunishmentPayload } from '../../utils/adminAPI';
import {
  AdminTable, SeverityBadge, ActionBtn, PageHeader, SectionCard,
} from '../../components/Admin/AdminUI';
import toast from 'react-hot-toast';
import { RiShieldLine } from 'react-icons/ri';

type ModTab = 'reports' | 'bans' | 'punish';

const AdminModeration: React.FC = () => {
  const [tab, setTab] = useState<ModTab>('reports');
  const { reports, loading: rLoading, resolve } = useAdminReports();
  const { bans, loading: bLoading, lift } = useAdminBans();

  // Punishment form state
  const [pUserId, setPUserId] = useState('');
  const [pAction, setPAction] = useState<PunishmentPayload['action']>('silence');
  const [pDuration, setPDuration] = useState('');
  const [pReason, setPReason] = useState('');
  const [pLoading, setPLoading] = useState(false);

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Moderation';
  }, []);

  const handlePunish = async () => {
    if (!pUserId || !pReason) { toast.error('User ID and reason are required'); return; }
    setPLoading(true);
    try {
      await adminAPI.issuePunishment({
        user_id: parseInt(pUserId),
        action: pAction,
        duration: pDuration || undefined,
        reason: pReason,
        send_notification: true,
      });
      toast.success('Punishment applied');
      setPUserId(''); setPReason(''); setPDuration('');
    } catch {
      toast.error('Failed to apply punishment');
    } finally {
      setPLoading(false);
    }
  };

  const TABS: { key: ModTab; label: string }[] = [
    { key: 'reports', label: 'Reports' },
    { key: 'bans',    label: 'Bans & restrictions' },
    { key: 'punish',  label: 'Issue punishment' },
  ];

  const inputCls = `w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg
                    px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-osu-pink/50`;

  return (
    <div>
      <PageHeader title="Moderation" sub="Reports, bans, and punishment management" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs px-4 py-2 rounded-lg transition-colors
              ${tab === t.key
                ? 'bg-osu-pink/15 text-osu-pink border border-osu-pink/20'
                : 'text-gray-500 hover:text-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports */}
      {tab === 'reports' && (
        <AdminTable
          loading={rLoading}
          cols={['Severity', 'Target', 'Reporter', 'Reason', 'Date', '']}
        >
          {reports.map(r => (
            <tr key={r.id} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-4 py-3"><SeverityBadge severity={r.severity} /></td>
              <td className="px-4 py-3 text-sm font-medium text-osu-pink">{r.target_username}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{r.reporter_username}</td>
              <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{r.reason}</td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <ActionBtn onClick={() => resolve(r.id, 'warn')}>Warn</ActionBtn>
                  <ActionBtn variant="danger" onClick={() => resolve(r.id, 'restrict')}>
                    Restrict
                  </ActionBtn>
                  <ActionBtn onClick={() => resolve(r.id, 'dismiss')}>Dismiss</ActionBtn>
                </div>
              </td>
            </tr>
          ))}
          {!rLoading && reports.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-gray-600">
                No open reports.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      {/* Bans */}
      {tab === 'bans' && (
        <AdminTable
          loading={bLoading}
          cols={['Player', 'Type', 'Reason', 'Issued by', 'Expires', '']}
        >
          {bans.map(b => (
            <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-100">{b.username}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border
                  ${b.type === 'ban'
                    ? 'bg-red-900/40 text-red-300 border-red-800'
                    : b.type === 'restriction'
                    ? 'bg-orange-900/40 text-orange-300 border-orange-800'
                    : 'bg-amber-900/40 text-amber-300 border-amber-800'}`}>
                  {b.type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{b.reason}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{b.issued_by}</td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'Permanent'}
              </td>
              <td className="px-4 py-3">
                <ActionBtn variant="success" onClick={() => lift(b.id, 'admin lifted')}>
                  Lift
                </ActionBtn>
              </td>
            </tr>
          ))}
          {!bLoading && bans.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-gray-600">
                No active bans.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      {/* Punishment form */}
      {tab === 'punish' && (
        <div className="max-w-lg">
          <SectionCard title="Issue punishment">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">User ID or username</label>
                <input
                  type="text"
                  value={pUserId}
                  onChange={e => setPUserId(e.target.value)}
                  placeholder="e.g. 1001 or xootynator"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Action</label>
                <select
                  value={pAction}
                  onChange={e => setPAction(e.target.value as PunishmentPayload['action'])}
                  className={inputCls}
                >
                  <option value="silence">Silence (chat only)</option>
                  <option value="restriction">Restriction (soft ban)</option>
                  <option value="ban">Ban</option>
                  <option value="score_wipe">Score wipe</option>
                  <option value="rank_reset">Rank reset</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Duration <span className="text-gray-700">(leave blank for permanent)</span>
                </label>
                <input
                  type="text"
                  value={pDuration}
                  onChange={e => setPDuration(e.target.value)}
                  placeholder="e.g. 1h, 7d, 30d"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Reason <span className="text-gray-700">(internal note)</span>
                </label>
                <textarea
                  value={pReason}
                  onChange={e => setPReason(e.target.value)}
                  placeholder="Score manipulation detected by anticheat — see audit log entry #..."
                  rows={4}
                  className={`${inputCls} resize-none font-sans`}
                />
              </div>

              <button
                onClick={handlePunish}
                disabled={pLoading}
                className="w-full flex items-center justify-center gap-2 bg-osu-pink/15 border
                           border-osu-pink/30 text-osu-pink text-sm font-medium rounded-lg py-2.5
                           hover:bg-osu-pink/25 transition-colors disabled:opacity-40"
              >
                <RiShieldLine />
                {pLoading ? 'Applying…' : 'Apply punishment'}
              </button>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;