import { Global, Module } from '@nestjs/common';
import { PermissionsCache } from './permissions.cache';

@Global()
@Module({
    providers: [PermissionsCache],
    exports: [PermissionsCache],
})
export class PermissionsCacheModule { }