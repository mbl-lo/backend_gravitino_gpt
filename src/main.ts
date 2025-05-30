import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config } from "./config/config";
import { join } from 'path';
import * as express from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1.0');

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.enableCors({
        origin: [
            'http://localhost:3001',
            'https://localhost:3001',
            'http://localhost:3000',
            'https://localhost:3000',
            'http://localhost:8080',
            'https://localhost:8080',
            'http://localhost',
            'https://localhost',
            'https://terminal.gravitino.ru',
            'http://terminal.gravitino.ru',
            'https://employer-ai.gravitino.ru',
            'http://employer-ai.gravitino.ru',
            'https://chat-ai.gravitino.ru'
        ],
        methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    })

  const configAPI = new DocumentBuilder()
    .setTitle('Gravitino GPT API')
    .setDescription('API Гравитино GPT')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, configAPI);

  SwaggerModule.setup('api', app, document, {
  });

  await app.listen(config.port);
}
bootstrap();
