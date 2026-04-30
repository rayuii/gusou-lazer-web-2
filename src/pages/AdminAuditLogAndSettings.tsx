import React, { useEffect } from 'react';
import { useAuditLog } from '../hooks/useAdmin';
import { adminAPI } from '../utils/api/admin';
import {
  AdminTable, PageHeader, SearchBar, AdminSelect, SectionCard,
} from '../components/Admin/AdminUI';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── Audit Log ─────────────────────────────────────────────────────────────────

const ACTION_COLOR: Record<string, string> = {
  ban:           'bg-red-900/40 text-red-300',
  unban:         'bg-emerald-900/40 text-emerald-300',
  silence:       'bg-amber-900/40 text-amber-300',
  restrict:      'bg-red-900/40 text-red-300',
  unrestrict:    'bg-emerald-900/40 text-emerald-300',
  score_delete:  'bg-purple-900/40 text-purple-300',
  score_wipe:    'bg-purple-900/40 text-purple-300',
  rank_reset:    'bg-orange-900/40 text-orange-300',
  rename:        'bg-blue-900/40 text-blue-300',
  reset_password:'bg-blue-900/40 text-blue-300',
  recalc_pp:     'bg-sky-900/40 text-sky-300',
  note:          'bg-gray-700/60 text-gray-300',
  login:         'bg-gray-800/60 text-gray-500',
  register:      'bg-emerald-900/40 text-emerald-300',
  report_resolve:'bg-amber-900/40 text-amber-300',
  config_update: 'bg-indigo-900/40 text-indigo-300',
};

export const AdminAuditLog: React.FC = () => {
  const {
    entries, loading,
    actionFilter, setActionFilter,
    targetFilter, setTargetFilter,
    refresh,
  } = useAuditLog();

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Audit log';
  }, []);

  const ACTION_OPTIONS = [
    { value: '', label: 'All actions' },
    ...['ban','unban','silence','restrict','unrestrict','score_delete','score_wipe',
        'rank_reset','rename','reset_password','recalc_pp','note','register',
        'report_resolve','config_update'].map(a => ({ value: a, label: a.replace('_', ' ') }))
  ];

  return (
    <div>
      <PageHeader
        title="Audit log"
        sub="Complete record of every admin action"
        actions={
          <button
            onClick={refresh}
            className="text-xs text-gray-400 hover:text-gray-100 border border-gray-800
                       px-3 py-1.5 rounded-lg transition-colors"
          >
            Refresh
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBar
          value={targetFilter}
          onChange={setTargetFilter}
          placeholder="Filter by target username…"
        />
        <AdminSelect
          value={actionFilter}
          onChange={setActionFilter}
          options={ACTION_OPTIONS}
        />
      </div>

      <AdminTable
        loading={loading}
        cols={['Time', 'Action', 'Admin', 'Target', 'Details']}
      >
        {entries.map(e => (
          <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
            <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
              {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
            </td>
            <td className="px-4 py-2.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded
                               ${ACTION_COLOR[e.action] ?? ACTION_COLOR.note}`}>
                {e.action.replace('_', ' ')}
              </span>
            </td>
            <td className="px-4 py-2.5 text-sm text-osu-pink font-medium">{e.actor}</td>
            <td className="px-4 py-2.5 text-sm text-gray-300">{e.target ?? '—'}</td>
            <td className="px-4 py-2.5 text-sm text-gray-500 max-w-md truncate">{e.details}</td>
          </tr>
        ))}
        {!loading && entries.length === 0 && (
          <tr>
            <td colSpan={5} className="py-16 text-center text-sm text-gray-600">
              No log entries found.
            </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};


// ── Settings ──────────────────────────────────────────────────────────────────

export const AdminSettings: React.FC = () => {
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Server settings';
  }, []);

  const inputCls = `w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg
                    px-3 py-2 focus:outline-none focus:border-osu-pink/50`;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await adminAPI.updateServerConfig(Object.fromEntries(fd));
      toast.success('Config saved');
    } catch {
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenance = async (
    action: 'recalc' | 'wipe',
  ) => {
    if (!confirm(`Are you sure? This action is ${action === 'wipe' ? 'IRREVERSIBLE' : 'expensive'}.`)) return;
    try {
      if (action === 'recalc') await adminAPI.triggerFullRecalc();
      else await adminAPI.wipeAllScores();
      toast.success(action === 'recalc' ? 'PP recalc queued' : 'All scores wiped');
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Server settings" sub="Runtime configuration and maintenance" />

      <form onSubmit={handleSave}>
        <SectionCard title="Server config">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Server name</label>
                <input name="server_name" defaultValue="My Lazer Server" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Max players</label>
                <input name="max_players" type="number" defaultValue={5000} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Score mode</label>
                <select name="score_mode" className={inputCls}>
                  <option value="lazer">lazer</option>
                  <option value="stable">stable</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">PP recalc</label>
                <select name="pp_recalc" className={inputCls}>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Registration</label>
                <select name="registration" className={inputCls}>
                  <option value="open">Open</option>
                  <option value="invite">Invite only</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Email verification</label>
                <select name="email_verification" className={inputCls}>
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                  <option value="off">Off</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-osu-pink/15 border border-osu-pink/30 text-osu-pink text-sm font-medium
                         rounded-lg px-4 py-2 hover:bg-osu-pink/25 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save config'}
            </button>
          </div>
        </SectionCard>
      </form>

      <SectionCard title="Danger zone">
        <p className="text-xs text-gray-500 mb-4">
          These actions are destructive and cannot be undone. They are logged to the audit trail.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleMaintenance('recalc')}
            className="text-sm border border-amber-800/60 text-amber-400 px-4 py-2 rounded-lg
                       hover:bg-amber-900/20 transition-colors"
          >
            Full PP recalculation
          </button>
          <button
            onClick={() => handleMaintenance('wipe')}
            className="text-sm border border-red-800/60 text-red-400 px-4 py-2 rounded-lg
                       hover:bg-red-900/20 transition-colors"
          >
            ⚠️ Wipe ALL scores
          </button>
        </div>
      </SectionCard>
    </div>
  );
};