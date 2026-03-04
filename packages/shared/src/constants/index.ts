export const APP_NAME = 'CNSS SIRAP';

export const DEFAULT_PAGE_SIZE = 20;

export const ROLE_PRIORITY = {
    OWNER: 1,
    ADMIN: 2,
    AGENT: 3,
} as const;

export const BANKS = ['BCIMR', 'CAC BANK', 'SALAAM BANK', 'EXIM BANK', 'BOA'] as const;

export const AMOUNT_RANGES = [
    { label: '0 - 50 000 DJF', min: 0, max: 50000 },
    { label: '50 000 - 100 000 DJF', min: 50000, max: 100000 },
    { label: '100 000 - 150 000 DJF', min: 100000, max: 150000 },
    { label: '150 000 - 200 000 DJF', min: 150000, max: 200000 },
    { label: '200 000+ DJF', min: 200000, max: Number.POSITIVE_INFINITY },
] as const;

export const MAX_UPLOAD_SIZE_MB = 10;

export const SUPPORTED_UPLOAD_FORMATS = ['.xlsx', '.xls', '.csv'] as const;
