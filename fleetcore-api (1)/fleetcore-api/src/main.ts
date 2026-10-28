import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelist descarta campos no declarados; forbidNonWhitelisted los rechaza con 400
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription(
      'API REST para la gestión de mantenimientos de la flota de FleetCore. Ejecuta `npm run seed` para cargar los datos de prueba; las credenciales ADMIN y TECHNICIAN están incluidas como ejemplos en Auth. Las respuestas de ejemplo muestran los registros sembrados.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`FleetCore API en http://localhost:${port}  |  Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
