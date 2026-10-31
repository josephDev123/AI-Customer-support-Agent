import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerSupportModule } from './features/customer-support/customer-support.module.js';
import { Env_validation } from './shared/schemas/env.validation.js';
import { appConfig } from './config/appConfig.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: Env_validation,
      load: [appConfig],
    }),
    CustomerSupportModule,
    PrismaModule,
  ],
})
export class AppModule {}
