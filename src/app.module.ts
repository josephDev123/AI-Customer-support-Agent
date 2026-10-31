import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerSupportModule } from './features/customer-support/customer-support.module';
import { Env_validation } from './shared/schemas/env.validation';
import { appConfig } from './config/appConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: Env_validation,
      load: [appConfig],
    }),
    CustomerSupportModule,
  ],
})
export class AppModule {}
