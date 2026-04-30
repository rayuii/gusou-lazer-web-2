import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:    string;
  value:    React.ReactNode;
  sub?:     string;
  accent?:  'pink' | 'green' | 'red' | 'amber' | 'default';
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  pink:    'text-osu-pink',
  green:   'text-emerald-400',
  red:     'text-red-400',
  amber:   'text-amber-400',
  default: 'text-gray-100',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent = 'default' }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
    <p className="text-xs text-gray-500 mb-1.5">{label}</p>
    <p className={`text-2xl font-semibold ${ACCENT_CLASSES[accent]}`}>{value}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

// ── AdminTable ───────────────────────────────────────────────────────────────

export const AdminTable: React.FC<{
  cols: React.ReactNode[];
  children: React.ReactNode;
  loading?: boolean;
}> = ({ cols, children, loading }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/80">
            {cols.map((c, i) => (
              <th
                key={i}
                className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {loading ? (
            <tr>
              <td colSpan={cols.length} className="py-16 text-center">
                <RiLoader4Line className="animate-spin text-osu-pink mx-auto text-xl" />
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  </div>
);

// ── GroupBadge ───────────────────────────────────────────────────────────────

export const GroupBadge: React.FC<{ short: string; colour: string }> = ({ short, colour }) => (
  <span
    className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1"
    style={{ background: colour + '22', color: colour, border: `1px solid ${colour}44` }}
  >
    {short}
  </span>
);

// ── SeverityBadge ────────────────────────────────────────────────────────────

const SEV: Record<string, string> = {
  high:   'bg-red-900/40 text-red-300 border-red-800',
  medium: 'bg-amber-900/40 text-amber-300 border-amber-800',
  low:    'bg-blue-900/40 text-blue-300 border-blue-800',
};

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => (
  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${SEV[severity] ?? SEV.low}`}>
    {severity}
  </span>
);

// ── StatusDot ────────────────────────────────────────────────────────────────

const DOTS: Record<string, string> = {
  online:  'bg-emerald-400',
  idle:    'bg-amber-400',
  offline: 'bg-gray-600',
};

export const StatusDot: React.FC<{ status?: string }> = ({ status = 'offline' }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${DOTS[status] ?? DOTS.offline}`} />
);

// ── ActionBtn ────────────────────────────────────────────────────────────────

export const ActionBtn: React.FC<{
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'success';
  size?: 'sm' | 'xs';
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, variant = 'default', size = 'xs', children, disabled }) => {
  const base = 'rounded font-medium transition-colors disabled:opacity-40 border';
  const sizes = { xs: 'text-[11px] px-2 py-1', sm: 'text-xs px-3 py-1.5' };
  const variants = {
    default: 'border-gray-700 text-gray-300 hover:bg-gray-800',
    danger:  'border-red-800/60 text-red-400 hover:bg-red-900/30',
    success: 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/30',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

// ── SearchBar ─────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search…' }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2
               placeholder:text-gray-600 focus:outline-none focus:border-osu-pink/50 w-full max-w-xs"
  />
);

// ── Select ────────────────────────────────────────────────────────────────────

export const AdminSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2
                focus:outline-none focus:border-osu-pink/50 ${className}`}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ── PageHeader ────────────────────────────────────────────────────────────────

export const PageHeader: React.FC<{
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}> = ({ title, sub, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ── SectionCard ───────────────────────────────────────────────────────────────

export const SectionCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({
  title, children, className = '',
}) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>
    {title && (
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

// ── AvatarCell ────────────────────────────────────────────────────────────────

export const AvatarCell: React.FC<{ url?: string; username: string; size?: number }> = ({
  url, username, size = 28,
}) => (
  <div className="flex items-center gap-2.5">
    <img
      src={url}
      alt={username}
      style={{ width: size, height: size }}
      className="rounded-lg object-cover flex-shrink-0 bg-gray-800"
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
    <span className="font-medium text-gray-100 text-sm">{username}</span>
  </div>
);