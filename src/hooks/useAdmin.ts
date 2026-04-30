import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI, type AdminUser, type AdminScore, type AuditLogEntry, type ServerStats, type AdminReport, type AdminBan, type AdminGameMode } from '../utils/adminAPI';
import toast from 'react-hot-toast';

// ── Server stats ────────────────────────────────────────────────────────────

export const useAdminStats = (refreshInterval = 30_000) => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch {
      // silently fail — dashboard can show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [fetch, refreshInterval]);

  return { stats, loading, refresh: fetch };
};

// ── Users ───────────────────────────────────────────────────────────────────

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]   = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage]     = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, s: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        query:  q || undefined,
        status: s !== 'all' ? (s as AdminUser['is_restricted'] extends true ? 'restricted' : never) : undefined,
        page:   p,
        limit:  50,
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query, status, page), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, status, page, load]);

  const restrictUser = async (userId: number, reason: string) => {
    await adminAPI.restrictUser(userId, reason);
    toast.success('User restricted');
    load(query, status, page);
  };

  const unrestrictUser = async (userId: number) => {
    await adminAPI.unrestrictUser(userId);
    toast.success('Restriction lifted');
    load(query, status, page);
  };

  const resetPassword = async (userId: number) => {
    const res = await adminAPI.resetUserPassword(userId);
    toast.success(`Temp password: ${res.temp_password}`, { duration: 10_000 });
  };

  const wipeScores = async (userId: number, mode?: AdminGameMode) => {
    await adminAPI.wipeUserScores(userId, mode);
    toast.success('Scores wiped');
  };

  return {
    users, total, loading,
    query, setQuery,
    status, setStatus,
    page, setPage,
    restrictUser, unrestrictUser, resetPassword, wipeScores,
    refresh: () => load(query, status, page),
  };
};

// ── Scores ──────────────────────────────────────────────────────────────────

export const useAdminScores = (type: 'top' | 'recent' | 'flagged' = 'top', mode: AdminGameMode = 'osu') => {
  const [scores, setScores]   = useState<AdminScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getScores({ type, mode, limit: 50, offset });
      setScores(data);
    } catch {
      toast.error('Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [type, mode, offset]);

  useEffect(() => { load(); }, [load]);

  const deleteScore = async (id: number, reason: string) => {
    await adminAPI.deleteScore(id, reason);
    toast.success('Score deleted');
    load();
  };

  return { scores, loading, offset, setOffset, deleteScore, refresh: load };
};

// ── Reports ─────────────────────────────────────────────────────────────────

export const useAdminReports = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getReports(false);
      setReports(data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id: number, action: string) => {
    await adminAPI.resolveReport(id, action);
    toast.success('Report resolved');
    load();
  };

  return { reports, loading, resolve, refresh: load };
};

// ── Bans ────────────────────────────────────────────────────────────────────

export const useAdminBans = () => {
  const [bans, setBans]       = useState<AdminBan[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getBans();
      setBans(data);
    } catch {
      toast.error('Failed to load bans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lift = async (banId: number, reason?: string) => {
    await adminAPI.liftBan(banId, reason);
    toast.success('Ban lifted');
    load();
  };

  return { bans, loading, lift, refresh: load };
};

// ── Audit log ───────────────────────────────────────────────────────────────

export const useAuditLog = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAuditLog({
        limit:  100,
        action: actionFilter || undefined,
        target: targetFilter || undefined,
      });
      setEntries(data);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetFilter]);

  useEffect(() => { load(); }, [load]);

  return { entries, loading, actionFilter, setActionFilter, targetFilter, setTargetFilter, refresh: load };
};