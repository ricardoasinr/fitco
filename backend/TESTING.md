# 🧪 Guía de Testing - FITCO Backend

Esta guía explica cómo ejecutar los tests del proyecto FITCO Backend, incluyendo unit tests, integration tests y end-to-end tests.

---

## 📋 Índice

- [Tipos de Tests](#tipos-de-tests)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Tests en Docker](#tests-en-docker)
- [Estructura de Tests](#estructura-de-tests)
- [Cobertura de Código](#cobertura-de-código)

---

## 🎯 Tipos de Tests

### 1. Unit Tests
**Ubicación:** `src/**/*.spec.ts`

Tests unitarios que prueban componentes individuales en aislamiento, usando mocks para dependencias.

**Ejemplos:**
- `src/auth/auth.service.spec.ts` - Lógica de autenticación
- `src/users/users.service.spec.ts` - Gestión de usuarios
- `src/attendance/attendance.service.spec.ts` - Lógica de asistencia

### 2. Integration Tests
**Ubicación:** `test/**/*.integration.spec.ts`

Tests de integración que prueban la interacción entre componentes y la base de datos.

**Ejemplos:**
- `test/auth.integration.spec.ts` - Flujos completos de autenticación

### 3. End-to-End Tests
**Ubicación:** `test/**/*.e2e-spec.ts`

Tests end-to-end que prueban el sistema completo desde la API hasta la base de datos.

**Ejemplos:**
- `test/auth.e2e-spec.ts` - Autenticación completa
- `test/attendance.e2e-spec.ts` - Asistencia con roles

---

## ⚙️ Configuración

### Base de Datos de Test

El proyecto utiliza una base de datos separada para tests:

- **Host:** `localhost` (o `postgres_test` en Docker)
- **Puerto:** `5433`
- **Base de datos:** `fitco_test_db`
- **Usuario:** `fitco`
- **Contraseña:** `fitco123`

### Variables de Entorno para Tests

Las siguientes variables se configuran automáticamente en los archivos de setup:

```bash
DATABASE_URL=postgresql://fitco:fitco123@localhost:5433/fitco_test_db
JWT_SECRET=test-jwt-secret-key
JWT_EXPIRES_IN=1d
NODE_ENV=test
```

---

## 🚀 Ejecutar Tests

### Opción 1: Usando npm scripts (Recomendado)

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Todos los tests
npm run test:all

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

### Opción 2: Usando Make (Docker)

```bash
# Unit tests
make test-unit

# Integration tests
make test-int

# E2E tests
make test-e2e

# Todos los tests
make test-all

# Tests con cobertura
make test-cov
```

### Opción 3: Script de Docker

```bash
# Ejecutar todos los tests en Docker
./test-docker.sh
```

---

## 🐳 Tests en Docker

### Configuración Inicial

1. **Levantar la base de datos de test:**
   ```bash
   docker-compose up -d postgres_test
   ```

2. **Ejecutar migraciones en la base de datos de test:**
   ```bash
   docker-compose exec -e DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db backend npx prisma migrate deploy
   ```

### Ejecutar Tests en Docker

```bash
# Unit tests
docker-compose exec backend npm run test

# Integration tests
docker-compose exec -e DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db backend npm run test:integration

# E2E tests
docker-compose exec -e DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db backend npm run test:e2e
```

---

## 📁 Estructura de Tests

```
backend/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts          # Unit test
│   ├── users/
│   │   └── users.service.spec.ts         # Unit test
│   └── attendance/
│       └── attendance.service.spec.ts     # Unit test
├── test/
│   ├── auth.integration.spec.ts          # Integration test
│   ├── auth.e2e-spec.ts                  # E2E test
│   ├── attendance.e2e-spec.ts            # E2E test
│   ├── jest-e2e.json                     # Config E2E
│   ├── jest-integration.json             # Config Integration
│   ├── setup-e2e.ts                      # Setup E2E
│   └── setup-integration.ts              # Setup Integration
└── package.json
```

---

## 📊 Cobertura de Código

### Generar Reporte de Cobertura

```bash
# Local
npm run test:cov

# Docker
make test-cov
```

### Ver Reporte

El reporte se genera en `backend/coverage/`. Abre `coverage/index.html` en tu navegador.

### Cobertura Actual

- ✅ **Auth Service:** ~95%
- ✅ **Users Service:** ~90%
- ✅ **Attendance Service:** ~85%

---

## 🧪 Ejemplos de Tests

### Unit Test Example

```typescript
describe('AuthService', () => {
  it('should register a new user successfully', async () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const result = await service.register(registerDto);

    expect(result).toHaveProperty('access_token');
    expect(result.user.role).toBe('USER');
  });
});
```

### Integration Test Example

```typescript
describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });
});
```

### E2E Test Example

```typescript
describe('GET /auth/profile', () => {
  it('should return user profile with valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
  });
});
```

---

## 🔒 Tests de Seguridad

Los tests incluyen verificaciones de seguridad:

- ✅ **Inyección SQL/NoSQL:** Pruebas de intentos de inyección
- ✅ **Autenticación:** Validación de tokens y credenciales
- ✅ **Autorización:** Verificación de roles y permisos
- ✅ **Validación de Input:** Rechazo de datos maliciosos
- ✅ **Exposición de Datos:** Verificación de que passwords no se exponen

Ver `SECURITY_VERIFICATION.md` para más detalles.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que la base de datos de test esté corriendo:
   ```bash
   docker-compose ps postgres_test
   ```

2. Verifica la URL de conexión en las variables de entorno

### Error: "Test timeout"

**Solución:**
- Los tests E2E tienen un timeout de 30 segundos
- Si necesitas más tiempo, ajusta `jest.setTimeout()` en `setup-e2e.ts`

### Error: "Prisma Client not generated"

**Solución:**
```bash
npx prisma generate
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

## ✅ Checklist de Tests

Antes de hacer commit, asegúrate de:

- [ ] Todos los unit tests pasan
- [ ] Todos los integration tests pasan
- [ ] Todos los e2e tests pasan
- [ ] Cobertura de código > 80%
- [ ] Tests de seguridad incluidos
- [ ] Documentación actualizada

---

**Última actualización:** Diciembre 2025

