import React, { useEffect } from 'react';
import { useAdminStats, useAuditLog } from '../hooks/useAdmin';
import { StatCard, PageHeader, SectionCard } from '../components/Admin/AdminUI';
import { RiRefreshLine } from 'react-icons/ri';
import { formatDistanceToNow } from 'date-fns';

const ACTION_CLASSES: Record<string, string> = {
  ban:          'bg-red-900/40 text-red-300',
  unban:        'bg-emerald-900/40 text-emerald-300',
  silence:      'bg-amber-900/40 text-amber-300',
  restrict:     'bg-red-900/40 text-red-300',
  score_delete: 'bg-purple-900/40 text-purple-300',
  score_wipe:   'bg-purple-900/40 text-purple-300',
  rename:       'bg-blue-900/40 text-blue-300',
  note:         'bg-gray-700/40 text-gray-300',
  login:        'bg-gray-700/40 text-gray-400',
  register:     'bg-emerald-900/40 text-emerald-300',
};

const AdminDashboard: React.FC = () => {
  const { stats, loading: statsLoading, refresh: refreshStats } = useAdminStats();
  const { entries, loading: logLoading } = useAuditLog();

  useEffect(() => {
    const el = document.getElementById('admin-page-title');
    if (el) el.textContent = 'Dashboard';
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub="Server overview and recent activity"
        actions={
          <button
            onClick={refreshStats}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 border border-gray-800
                       px-3 py-1.5 rounded-lg transition-colors"
          >
            <RiRefreshLine className={statsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total players"
          value={stats?.total_users?.toLocaleString() ?? '—'}
          sub={stats?.registered_today ? `+${stats.registered_today} today` : undefined}
          accent="pink"
        />
        <StatCard
          label="Online now"
          value={stats?.online_users?.toLocaleString() ?? '—'}
          sub="active sessions"
          accent="green"
        />
        <StatCard
          label="Scores today"
          value={stats?.scores_today?.toLocaleString() ?? '—'}
          sub={`${stats?.scores_total?.toLocaleString() ?? '—'} total`}
        />
        <StatCard
          label="Open reports"
          value={stats?.open_reports ?? '—'}
          sub={`${stats?.active_bans ?? '—'} active bans`}
          accent={stats?.open_reports ? 'red' : 'default'}
        />
      </div>

      {/* Lower grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Audit log feed */}
        <div className="lg:col-span-2">
          <SectionCard title="Recent audit log">
            {logLoading ? (
              <div className="py-8 text-center text-sm text-gray-600">Loading…</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-600">No entries yet.</div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-800/60">
                {entries.slice(0, 12).map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0
                                  ${ACTION_CLASSES[entry.action] ?? ACTION_CLASSES.note}`}
                    >
                      {entry.action.replace('_', ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-snug">
                        <span className="text-osu-pink font-medium">{entry.actor}</span>
                        {entry.target && <> → <span className="text-gray-100 font-medium">{entry.target}</span></>}
                        {' '}<span className="text-gray-500">{entry.details}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <SectionCard title="Quick actions">
            <div className="space-y-2">
              {[
                { label: 'View flagged scores',  href: '/admin/scores?type=flagged' },
                { label: 'Open reports',         href: '/admin/mod' },
                { label: 'Recently registered',  href: '/admin/users?status=new' },
                { label: 'Restricted players',   href: '/admin/users?status=restricted' },
                { label: 'Audit log',            href: '/admin/audit-log' },
              ].map(a => (
                <a
                  key={a.href}
                  href={a.href}
                  className="block text-sm text-gray-400 hover:text-osu-pink py-1.5 border-b border-gray-800/50
                             last:border-0 transition-colors"
                >
                  {a.label} →
                </a>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Server info">
            <div className="space-y-2 text-sm">
              {[
                { k: 'Scores (total)', v: stats?.scores_total?.toLocaleString() ?? '—' },
                { k: 'Active bans',    v: stats?.active_bans ?? '—' },
              ].map(row => (
                <div key={row.k} className="flex justify-between">
                  <span className="text-gray-500">{row.k}</span>
                  <span className="text-gray-200 font-medium">{row.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;