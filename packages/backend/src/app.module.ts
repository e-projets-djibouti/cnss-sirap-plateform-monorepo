import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    PrismaModule,
    // TODO: importer les modules métier ici (AuthModule, UsersModule...)
  ],
})
export class AppModule {}
