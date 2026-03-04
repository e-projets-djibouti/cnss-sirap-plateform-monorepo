// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  mustChangePassword: boolean;
  isActive: boolean;
  role: { id: string; name: string; level: number };
  profile: { fullName: string; phone?: string | null; avatarUrl?: string | null } | null;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// ── Roles & Permissions ───────────────────────────────────────────────────────

export interface Permission {
  id: string;
  action: string;
  description?: string | null;
  createdAt: string;
}

export interface RolePermissionEntry {
  permission: { id: string; action: string; description?: string | null };
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  isSystem: boolean;
  permissions: RolePermissionEntry[];
  _count: { users: number };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string; level: number };
  profile: { fullName: string; phone?: string | null; avatarUrl?: string | null } | null;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
