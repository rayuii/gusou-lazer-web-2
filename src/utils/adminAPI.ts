// Re-export shim so existing imports from '../utils/adminAPI' keep working
export { adminAPI } from './api/admin';
export type {
  AdminUser,
  AdminScore,
  AdminScoresParams,
  AdminScoresResponse,
  AdminUsersParams,
  AdminUsersResponse,
  AdminBan,
  AdminReport,
  AuditLogEntry,
  AuditLogParams,
  AuditLogResponse,
  PunishmentPayload,
  ResolveAction,
  ServerConfig,
  ServerStats,
} from '../types/admin';

// AdminGameMode isn't in types/admin yet — define it here
export type AdminGameMode = 'osu' | 'taiko' | 'catch' | 'mania';