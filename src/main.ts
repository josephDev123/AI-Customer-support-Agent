import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      // json: true
    }),
  });
  app.enableCors();
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port);
}
void bootstrap();
