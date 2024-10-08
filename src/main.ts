import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const config = new DocumentBuilder()
    .setTitle('Zalỏ App API')
    .setDescription('API Documentation for Zalỏ')
    .setVersion('1.0')
    .addBasicAuth()
    .addApiKey()
    .addCookieAuth()
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.APP_PORT);
}
bootstrap();
