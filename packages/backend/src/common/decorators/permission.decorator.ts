import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

/** Spécifie la permission requise pour accéder à une route */
export const RequirePermission = (action: string) =>
  SetMetadata(PERMISSION_KEY, action);
