// ── Entités de base ──────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum RecordStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
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
