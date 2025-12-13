import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Configuración de límites de payload
  app.use(require('body-parser').json({ limit: '10mb' }));
  app.use(require('body-parser').urlencoded({ limit: '10mb', extended: true }));

  // Configuración de CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Middleware para cookies
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Endpoint de salud para integraciones móviles/web
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: any, res: any) => {
    res.type('application/json').status(200).send({ status: 'ok' });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor corriendo en http://localhost:${port}`);
  const http = require('http');
  const proxyServer = http.createServer((req: any, res: any) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxyReq = http.request(options, (proxyRes: any) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (_err: any) => {
      res.statusCode = 502;
      res.end(JSON.stringify({ message: 'Proxy error' }));
    });
    req.pipe(proxyReq);
  });
  proxyServer.listen(8080, '0.0.0.0', () => {
    console.log(`Servidor adicional en http://localhost:8080`);
  });
}
bootstrap();
