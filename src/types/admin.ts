// src/types/admin.ts

import type { GameMode } from './scores';

// ── Server stats ──────────────────────────────────────────────────────────────

export interface ServerStats {
  total_users: number;
  online_users: number;
  scores_today: number;
  scores_total: number;
  open_reports: number;
  active_bans: number;
  registered_today: number;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'ban' | 'unban' | 'silence' | 'restrict' | 'unrestrict'
  | 'score_delete' | 'score_wipe' | 'rank_reset' | 'rename'
  | 'reset_password' | 'recalc_pp' | 'note' | 'login' | 'register'
  | 'report_resolve' | 'config_update';

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  actor: string;
  target?: string;
  details: string;
  created_at: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUserGroup {
  id: number;
  short_name: string;
  name: string;
  colour: string;
}

export interface AdminUserStats {
  global_rank?: number;
  country_rank?: number;
  pp: number;
  ranked_score: number;
  hit_accuracy: number;
  play_count: number;
  total_score: number;
  total_hits: number;
  maximum_combo: number;
  level: { current: number; progress: number };
  grade_counts: { ssh: number; ss: number; sh: number; s: number; a: number };
}

export interface AdminUser {
  id: number;
  username: string;
  avatar_url: string;
  cover_url?: string;
  country_code: string;
  country?: { code: string; name: string };
  groups?: AdminUserGroup[];
  is_restricted: boolean;
  is_silenced: boolean;
  is_active: boolean;
  join_date: string;
  last_visit?: string;
  statistics?: AdminUserStats;
  statistics_rulesets?: Partial<Record<GameMode, AdminUserStats>>;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// ── Scores ────────────────────────────────────────────────────────────────────

export interface AdminScore {
  id: number;
  user_id: number;
  username: string;
  beatmap_id: number;
  beatmap_title: string;
  beatmap_version: string;
  difficulty_rating: number;
  rank: string;
  accuracy: number;
  pp?: number;
  max_combo: number;
  mods: string[];
  total_score: number;
  created_at: string;
  flagged: boolean;
}

export interface AdminScoresResponse {
  scores: AdminScore[];
  total: number;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export type ReportSeverity = 'low' | 'medium' | 'high';

export interface AdminReport {
  id: number;
  reporter_id: number;
  reporter_username: string;
  target_id: number;
  target_username: string;
  reason: string;
  comments: string;
  severity: ReportSeverity;
  created_at: string;
  resolved: boolean;
}

export type ResolveAction = 'warn' | 'silence' | 'restrict' | 'ban' | 'dismiss';

// ── Bans ──────────────────────────────────────────────────────────────────────

export type BanType = 'ban' | 'restriction' | 'silence';

export interface AdminBan {
  id: number;
  user_id: number;
  username: string;
  type: BanType;
  reason: string;
  duration?: string;
  expires_at?: string;
  issued_by: string;
  issued_at: string;
}

// ── Punishments ───────────────────────────────────────────────────────────────

export type PunishmentAction =
  | 'silence'
  | 'restriction'
  | 'ban'
  | 'score_wipe'
  | 'rank_reset';

export interface PunishmentPayload {
  user_id: number;
  action: PunishmentAction;
  duration?: string;
  reason: string;
  send_notification?: boolean;
}

// ── Server config ─────────────────────────────────────────────────────────────

export type ScoreMode       = 'lazer' | 'stable';
export type PPRecalcMode    = 'automatic' | 'manual' | 'disabled';
export type RegistrationMode = 'open' | 'invite' | 'disabled';
export type EmailVerify     = 'required' | 'optional' | 'off';

export interface ServerConfig {
  server_name: string;
  max_players: number;
  score_mode: ScoreMode;
  pp_recalc: PPRecalcMode;
  registration: RegistrationMode;
  email_verification: EmailVerify;
  require_totp: boolean;
  enable_beatmap_preload: boolean;
}

// ── Query params ──────────────────────────────────────────────────────────────

export type AdminUserStatus = 'all' | 'online' | 'restricted' | 'silenced' | 'banned';
export type AdminScoreType  = 'top' | 'recent' | 'flagged';

export interface AdminUsersParams {
  q?: string;
  country?: string;
  status?: AdminUserStatus;
  page?: number;
  limit?: number;
}

export interface AdminScoresParams {
  type?: AdminScoreType;
  mode?: GameMode;
  user_id?: number;
  limit?: number;
  offset?: number;
}

export interface AuditLogParams {
  limit?: number;
  offset?: number;
  action?: string;
  target?: string;
}