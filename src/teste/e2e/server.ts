// Sobe a API para os testes end-to-end. Mesma configuração do main.ts, mas:
// - só aceita o banco local de testes;
// - sem limite de requisições, que derrubaria os testes em sequência.
import { assertTestDatabase } from './guard';

assertTestDatabase();

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@common/filters/exception.filter';
import { MulterExceptionFilter } from '@common/filters/multer-exception.filter';
import { R2Service } from '@modules/r2/r2.service';

ThrottlerGuard.prototype.canActivate = async () => true;

// Uploads não vão para o Cloudflare R2 de verdade
let fakeUploads = 0;
R2Service.prototype.uploadImage = async (_file, folder) => `https://r2.teste/${folder}/img-${++fakeUploads}.png`;
R2Service.prototype.uploadVideo = async (_file, folder) => `https://r2.teste/${folder}/video-${++fakeUploads}.mp4`;
R2Service.prototype.uploadDocument = async (_file, folder) => `https://r2.teste/${folder}/doc-${++fakeUploads}.pdf`;
R2Service.prototype.delete = async () => undefined;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });

  app.useBodyParser('json', { limit: '1mb' });
  app.enableCors({ origin: [process.env.CORS_ORIGIN ?? 'http://localhost:5173'], credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter(), new MulterExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3004);
  console.log('API de teste no ar');
}

bootstrap();
