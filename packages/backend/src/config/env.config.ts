export default () => ({
  port: parseInt(process.env.API_PORT ?? '3000', 10),
  app: {
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    avatarBucket: process.env.MINIO_AVATAR_BUCKET ?? 'avatars',
    auditBucket: process.env.MINIO_AUDIT_BUCKET ?? 'audit-archives',
    publicUrl: process.env.MINIO_PUBLIC_URL,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'no-reply@cnss-sirap.local',
  },
  security: {
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'sirap_refresh_token',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite:
      (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none' | undefined) ??
      'strict',
    auditLogPath: process.env.AUDIT_LOG_PATH ?? 'logs/security-audit.log',
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS ?? '90', 10),
    roleRateLimit: {
      windowSec: parseInt(process.env.RL_WINDOW_SEC ?? '60', 10),
      public: parseInt(process.env.RL_PUBLIC_LIMIT ?? '60', 10),
      agent: parseInt(process.env.RL_AGENT_LIMIT ?? '180', 10),
      admin: parseInt(process.env.RL_ADMIN_LIMIT ?? '300', 10),
      owner: parseInt(process.env.RL_OWNER_LIMIT ?? '600', 10),
      login: parseInt(process.env.RL_LOGIN_LIMIT ?? '5', 10),
      refresh: parseInt(process.env.RL_REFRESH_LIMIT ?? '20', 10),
    },
  },
});
