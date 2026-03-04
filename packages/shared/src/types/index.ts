// ── Entités de base ──────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CNSSRecord {
  no: number;
  brenet: string;
  nomsEtPrenoms: string;
  netAPayer: number;
  codePeriode: string;
  typeRelation: string;
  nomMere?: string;
  nature: string;
  banque: string;
  rib: string;
  isDuplicate?: boolean;
  duplicateGroup?: number;
}

export interface CNSSStats {
  totalRecords: number;
  totalAmount: number;
  assures: number;
  conjoints: number;
  duplicates: number;
  duplicateGroups: number;
  uniqueBanks: number;
}

// ── Enums ────────────────────────────────────────────────────────────────────

export enum RecordStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export enum AppRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface PaginationDto {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
}
