import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Pruebas API - Proyecto AGROTIC', () => {
  let app;
  let authToken = '';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    
    // Test 1: Login exitoso (Caso normal)
    test('POST /auth/login - Debe autenticar usuario con credenciales válidas', async () => {
      const loginData = {
        numero_documento: '999999',
        password: 'Admin12345'
      };

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      authToken = res.body.access_token;
    });

    // Test 2: Login con credenciales inválidas (Caso que debe fallar)
    test('POST /auth/login - Debe rechazar credenciales inválidas', async () => {
      const loginData = {
        numero_documento: '999999999',
        password: 'wrongpassword'
      };

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    // Test 3: Login con datos incompletos (Caso límite)
    test('POST /auth/login - Debe rechazar login sin contraseña', async () => {
      const loginData = {
        numero_documento: '123456789'
      };

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
    });

    // Test 4: Registro exitoso (Caso normal)
    test('POST /auth/register - Debe registrar nuevo usuario', async () => {
      const userData = {
        nombres: 'Usuario Test',
        apellidos: 'Prueba Unitaria',
        numero_documento: '999888777',
        password: 'testpassword123',
        email: 'test@example.com',
        id_rol: 3 
      };

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.numero_documento).toBe(userData.numero_documento);
    });

    // Test 5: Registro con documento duplicado (Caso que debe fallar)
    test('POST /auth/register - Debe rechazar documento duplicado', async () => {
      const userData = {
        nombres: 'Usuario Duplicado',
        apellidos: 'Test',
        numero_documento: '999999', // Ya existe
        password: 'password123',
        email: 'duplicate@example.com',
        id_rol: 3
      };

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
    });

    // Test 6: Forgot password (Caso normal)
    test('POST /auth/forgot-password - Debe procesar solicitud de recuperación', async () => {
      const forgotData = {
        email: 'admin@example.com'
      };

      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotData);

      expect(res.status).toBe(200);
    });

    // Test 7: Forgot password con email inválido (Caso que debe fallar)
    test('POST /auth/forgot-password - Debe rechazar email no existente', async () => {
      const forgotData = {
        email: 'nonexistent@example.com'
      };

      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotData);

      expect(res.status).toBe(404);
    });
  });
  
  describe('Usuarios Endpoints', () => {
    
    // Test 8: Listar usuarios (Caso normal)
    test('GET /usuarios - Debe listar usuarios con autenticación', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    // Test 9: Listar usuarios sin token (Caso que debe fallar)
    test('GET /usuarios - Debe rechazar acceso sin token', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios');

      expect(res.status).toBe(401);
    });

    // Test 10: Obtener usuario por ID (Caso normal)
    test('GET /usuarios/:id - Debe retornar usuario existente', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(1);
    });

    // Test 11: Obtener usuario con ID inexistente (Caso límite)
    test('GET /usuarios/:id - Debe retornar 404 para ID inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    // Test 12: Obtener usuario con ID inválido (Caso que debe fallar)
    test('GET /usuarios/:id - Debe rechazar ID no numérico', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios/abc')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    // Test 13: Crear usuario (Caso normal)
    test('POST /usuarios - Debe crear nuevo usuario', async () => {
      const userData = {
        nombres: 'Nuevo Usuario',
        apellidos: 'Test API',
        numero_documento: '555444333',
        password: 'newpassword123',
        email: 'newuser@example.com',
        id_rol: 3
      };

      const res = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    // Test 14: Crear usuario sin permisos (Caso que debe fallar)
    test('POST /usuarios - Debe rechazar creación sin rol admin', async () => {
      // obtenemos token de usuario no admin
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          numero_documento: '999888777',
          password: 'testpassword123'
        });

      const userToken = loginRes.body.access_token;

      const userData = {
        nombres: 'Usuario No Admin',
        apellidos: 'Test',
        numero_documento: '111222333',
        password: 'password123',
        email: 'noadmin@example.com',
        id_rol: 3
      };

      const res = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send(userData);

      expect(res.status).toBe(403);
    });

    // Test 15: Actualizar usuario (Caso normal)
    test('PATCH /usuarios/:id - Debe actualizar usuario existente', async () => {
      const updateData = {
        nombres: 'Usuario Actualizado',
        apellidos: 'Test Update'
      };

      const res = await request(app.getHttpServer())
        .patch('/usuarios/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.nombres).toBe(updateData.nombres);
    });

    // Test 16: Actualizar usuario con datos inválidos (Caso que debe fallar)
    test('PATCH /usuarios/:id - Debe rechazar actualización con email inválido', async () => {
      const updateData = {
        email: 'email-invalido'
      };

      const res = await request(app.getHttpServer())
        .patch('/usuarios/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
    });
  });
  
  describe('Cultivos Endpoints', () => {
    
    // Test 17: Listar cultivos (Caso normal)
    test('GET /cultivos - Debe listar todos los cultivos', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    // Test 18: Listar cultivos sin autenticación (Caso que debe fallar)
    test('GET /cultivos - Debe rechazar acceso sin token', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos');

      expect(res.status).toBe(401);
    });

    // Test 19: Crear cultivo (Caso normal)
    test('POST /cultivos - Debe crear nuevo cultivo', async () => {
      const cultivoData = {
        nombre: 'Cultivo Test Unitario',
        descripcion: 'Descripción del cultivo de prueba',
        fecha_siembra: '2024-01-15',
        fecha_cosecha_estimada: '2024-04-15',
        id_lote: 1,
        id_tipo_cultivo: 1,
        estado: 'activo'
      };

      const res = await request(app.getHttpServer())
        .post('/cultivos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cultivoData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(cultivoData.nombre);
    });

    // Test 20: Crear cultivo con datos incompletos (Caso que debe fallar)
    test('POST /cultivos - Debe rechazar creación sin nombre', async () => {
      const cultivoData = {
        descripcion: 'Cultivo sin nombre',
        id_lote: 1
      };

      const res = await request(app.getHttpServer())
        .post('/cultivos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cultivoData);

      expect(res.status).toBe(400);
    });

    // Test 21: Obtener cultivo por ID (Caso normal)
    test('GET /cultivos/:id - Debe retornar cultivo específico', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    // Test 22: Obtener cultivo inexistente (Caso límite)
    test('GET /cultivos/:id - Debe retornar 404 para cultivo inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    // Test 23: Actualizar cultivo (Caso normal)
    test('PATCH /cultivos/:id - Debe actualizar cultivo existente', async () => {
      const updateData = {
        nombre: 'Cultivo Actualizado',
        estado: 'en_proceso'
      };

      const res = await request(app.getHttpServer())
        .patch('/cultivos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe(updateData.nombre);
    });

    // Test 24: Eliminar cultivo (Caso normal)
    test('DELETE /cultivos/:id - Debe eliminar cultivo existente', async () => {
      const res = await request(app.getHttpServer())
        .delete('/cultivos/2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);
    });

    // Test 25: Eliminar cultivo inexistente (Caso que debe fallar)
    test('DELETE /cultivos/:id - Debe retornar 404 al eliminar inexistente', async () => {
      const res = await request(app.getHttpServer())
        .delete('/cultivos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    // Test 26: Obtener estadísticas de cultivos (Caso normal)
    test('GET /cultivos/estadisticas - Debe retornar estadísticas', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos/estadisticas')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
    });

    // Test 27: Obtener calendario de cultivos (Caso normal)
    test('GET /cultivos/calendario - Debe retornar calendario', async () => {
      const res = await request(app.getHttpServer())
        .get('/cultivos/calendario')
        .query({
          fecha_desde: '2024-01-01',
          fecha_hasta: '2024-12-31'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
  
  describe('Lotes Endpoints', () => {
    
    // Test 28: Listar lotes (Caso normal)
    test('GET /lotes - Debe listar todos los lotes', async () => {
      const res = await request(app.getHttpServer())
        .get('/lotes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    // Test 29: Crear lote (Caso normal)
    test('POST /lotes - Debe crear nuevo lote', async () => {
      const loteData = {
        nombre: 'Lote Test Unitario',
        descripcion: 'Descripción del lote de prueba',
        area_hectareas: 5.5,
        ubicacion: 'Ubicación test',
        coordenadas: [
          { lat: 4.5, lng: -74.2 },
          { lat: 4.6, lng: -74.1 },
          { lat: 4.4, lng: -74.3 },
          { lat: 4.5, lng: -74.2 }
        ],
        estado: 'activo'
      };

      const res = await request(app.getHttpServer())
        .post('/lotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(loteData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(loteData.nombre);
    });

    // Test 30: Crear lote con área negativa (Caso que debe fallar)
    test('POST /lotes - Debe rechazar lote con área negativa', async () => {
      const loteData = {
        nombre: 'Lote Inválido',
        area_hectareas: -1,
        ubicacion: 'Test'
      };

      const res = await request(app.getHttpServer())
        .post('/lotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(loteData);

      expect(res.status).toBe(400);
    });

    // Test 31: Obtener lote por ID (Caso normal)
    test('GET /lotes/:id - Debe retornar lote específico', async () => {
      const res = await request(app.getHttpServer())
        .get('/lotes/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    // Test 32: Actualizar lote (Caso normal)
    test('PATCH /lotes/:id - Debe actualizar lote existente', async () => {
      const updateData = {
        nombre: 'Lote Actualizado',
        area_hectareas: 6.0
      };

      const res = await request(app.getHttpServer())
        .patch('/lotes/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe(updateData.nombre);
    });

    // Test 33: Eliminar lote (Caso normal)
    test('DELETE /lotes/:id - Debe eliminar lote existente', async () => {
      const res = await request(app.getHttpServer())
        .delete('/lotes/3')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    // Test 34: Actualizar coordenadas de lote (Caso normal)
    test('PUT /lotes/:id/coordenadas - Debe actualizar coordenadas', async () => {
      const coordsData = {
        coordenadas: [
          { lat: 4.7, lng: -74.0 },
          { lat: 4.8, lng: -73.9 },
          { lat: 4.6, lng: -74.1 },
          { lat: 4.7, lng: -74.0 }
        ]
      };

      const res = await request(app.getHttpServer())
        .put('/lotes/1/coordenadas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coordsData);

      expect(res.status).toBe(200);
    });

    // Test 35: Actualizar coordenadas inválidas (Caso que debe fallar)
    test('PUT /lotes/:id/coordenadas - Debe rechazar coordenadas inválidas', async () => {
      const coordsData = {
        coordenadas: [] // Array vacío
      };

      const res = await request(app.getHttpServer())
        .put('/lotes/1/coordenadas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coordsData);

      expect(res.status).toBe(400);
    });

    // Test 36: Obtener datos de mapa (Caso normal)
    test('GET /lotes/map-data - Debe retornar datos geográficos', async () => {
      const res = await request(app.getHttpServer())
        .get('/lotes/map-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
  
  describe('Validaciones de Seguridad', () => {
    
    // Test 37: Acceso sin token a endpoint protegido
    test('Debe rechazar acceso a endpoint protegido sin token', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios');

      expect(res.status).toBe(401);
    });

    // Test 38: Token inválido
    test('Debe rechazar acceso con token inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
    });

    // Test 39: Token malformado
    test('Debe rechazar token malformado', async () => {
      const res = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', 'InvalidToken');

      expect(res.status).toBe(401);
    });
  });
});
