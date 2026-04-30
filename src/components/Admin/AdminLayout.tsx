import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  RiDashboardLine,
  RiUserLine,
  RiBarChartLine,
  RiShieldLine,
  RiFileListLine,
  RiSettings3Line,
} from 'react-icons/ri';

interface NavItem {
  to:    string;
  icon:  React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin',           icon: <RiDashboardLine />, label: 'Dashboard'   },
  { to: '/admin/users',     icon: <RiUserLine />,      label: 'Players'     },
  { to: '/admin/scores',    icon: <RiBarChartLine />,  label: 'Scores'      },
  { to: '/admin/mod',       icon: <RiShieldLine />,    label: 'Moderation'  },
  { to: '/admin/audit-log', icon: <RiFileListLine />,  label: 'Audit log'   },
  { to: '/admin/settings',  icon: <RiSettings3Line />, label: 'Settings'    },
];

const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  if (!user?.is_admin) return <Navigate to="/" replace />;
  console.log(user);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-gray-800 bg-gray-900">
        {/* Logo / server name */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-800">
          <div className="w-7 h-7 rounded-full bg-osu-pink flex items-center justify-center text-[11px] font-bold text-white">
            osu
          </div>
          <span className="text-sm font-semibold text-gray-100 truncate">Admin panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                 ${isActive
                   ? 'bg-osu-pink/15 text-osu-pink border border-osu-pink/20'
                   : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                 }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Current admin */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-100 truncate">{user.username}</p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900">
          <div id="admin-page-title" className="text-sm font-semibold text-gray-100" />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Server online
            </span>
          </div>
        </header>

        {/* Page outlet */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;