// src/utils/api/admin.ts

import { api } from './client'; // your existing axios instance
import type {
  AdminBan,
  AdminReport,
  AdminScoresParams,
  AdminScoresResponse,
  AdminUser,
  AdminUsersParams,
  AdminUsersResponse,
  AuditLogParams,
  AuditLogResponse,
  PunishmentPayload,
  ResolveAction,
  ServerConfig,
  ServerStats,
} from '../../types/admin';

export const adminAPI = {
  // ── Dashboard ───────────────────────────────────────────────────────────────

  getStats: async (): Promise<ServerStats> => {
    const res = await api.get('/api/admin/stats');
    return res.data;
  },

  // ── Audit log ───────────────────────────────────────────────────────────────

  getAuditLog: async (params?: AuditLogParams): Promise<AuditLogResponse> => {
    const qs = new URLSearchParams();
    if (params?.limit)  qs.append('limit',  String(params.limit));
    if (params?.offset) qs.append('offset', String(params.offset));
    if (params?.action) qs.append('action', params.action);
    if (params?.target) qs.append('target', params.target);
    const res = await api.get(`/api/admin/audit-log?${qs}`);
    return res.data;
  },

  // ── Users ───────────────────────────────────────────────────────────────────

  getUsers: async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
    const qs = new URLSearchParams();
    if (params?.q)       qs.append('q',       params.q);
    if (params?.country) qs.append('country', params.country);
    if (params?.status && params.status !== 'all')
                         qs.append('status',  params.status);
    qs.append('page',  String(params?.page  ?? 1));
    qs.append('limit', String(params?.limit ?? 50));
    const res = await api.get(`/api/admin/users?${qs}`);
    return res.data;
  },

  getUser: async (userId: number): Promise<AdminUser> => {
    const res = await api.get(`/api/admin/users/${userId}`);
    return res.data;
  },

  renameUser: async (userId: number, username: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/rename`, { username });
  },

  setUserGroups: async (userId: number, groups: string[]): Promise<void> => {
    await api.put(`/api/admin/users/${userId}/groups`, { groups });
  },

  resetUserPassword: async (userId: number): Promise<{ temp_password: string }> => {
    const res = await api.post(`/api/admin/users/${userId}/reset-password`);
    return res.data;
  },

  restrictUser: async (userId: number, reason: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/restrict`, { reason });
  },

  unrestrictUser: async (userId: number): Promise<void> => {
    await api.delete(`/api/admin/users/${userId}/restrict`);
  },

  wipeUserScores: async (userId: number, mode?: string, reason?: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/wipe-scores`, {
      mode,
      reason: reason ?? 'admin action',
    });
  },

  recalcUserPP: async (userId: number, mode?: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/recalc-pp`, undefined, {
      params: { mode },
    });
  },

  // ── Scores ──────────────────────────────────────────────────────────────────

  getScores: async (params?: AdminScoresParams): Promise<AdminScoresResponse> => {
    const qs = new URLSearchParams();
    if (params?.type)    qs.append('type',    params.type);
    if (params?.mode)    qs.append('mode',    params.mode);
    if (params?.user_id) qs.append('user_id', String(params.user_id));
    qs.append('limit',  String(params?.limit  ?? 50));
    qs.append('offset', String(params?.offset ?? 0));
    const res = await api.get(`/api/admin/scores?${qs}`);
    return res.data;
  },

  deleteScore: async (scoreId: number, reason: string): Promise<void> => {
    await api.delete(`/api/admin/scores/${scoreId}`, { data: { reason } });
  },

  // ── Reports ─────────────────────────────────────────────────────────────────

  getReports: async (resolved = false): Promise<AdminReport[]> => {
    const res = await api.get('/api/admin/reports', { params: { resolved } });
    return res.data;
  },

  resolveReport: async (reportId: number, action: ResolveAction, notes?: string): Promise<void> => {
    await api.post(`/api/admin/reports/${reportId}/resolve`, { action, notes });
  },

  // ── Punishments ─────────────────────────────────────────────────────────────

  issuePunishment: async (payload: PunishmentPayload): Promise<void> => {
    await api.post('/api/admin/punishments', payload);
  },

  // ── Bans ────────────────────────────────────────────────────────────────────

  getBans: async (): Promise<AdminBan[]> => {
    const res = await api.get('/api/admin/bans');
    return res.data;
  },

  liftBan: async (banId: number, reason?: string): Promise<void> => {
    await api.delete(`/api/admin/bans/${banId}`, { data: { reason } });
  },

  // ── Config ──────────────────────────────────────────────────────────────────

  getServerConfig: async (): Promise<ServerConfig> => {
    const res = await api.get('/api/admin/config');
    return res.data;
  },

  updateServerConfig: async (config: Partial<ServerConfig>): Promise<void> => {
    await api.put('/api/admin/config', config);
  },

  // ── Maintenance ─────────────────────────────────────────────────────────────

  triggerFullRecalc: async (mode?: string): Promise<void> => {
    await api.post('/api/admin/maintenance/recalc-pp', { mode, confirm: true });
  },

  wipeAllScores: async (): Promise<void> => {
    await api.post('/api/admin/maintenance/wipe-scores', { confirm: true });
  },
};