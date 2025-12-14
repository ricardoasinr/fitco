# 📖 Guía de Instalación y Configuración - FITCO

Esta guía te ayudará a configurar y ejecutar el proyecto FITCO Wellness Platform en tu entorno local.

---

## 📋 Tabla de Contenidos

1. [Estado del Proyecto](#estado-del-proyecto)
2. [Tech Stack](#tech-stack)
3. [Prerrequisitos](#prerrequisitos)
4. [Instalación Rápida](#instalación-rápida)
5. [Configuración Detallada](#configuración-detallada)
6. [Ejecutar el Proyecto](#ejecutar-el-proyecto)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Comandos Disponibles](#comandos-disponibles)
9. [Arquitectura y SOLID](#arquitectura-y-solid)
10. [Seguridad](#seguridad)
11. [Endpoints de la API](#endpoints-de-la-api)
12. [Troubleshooting](#troubleshooting)

---

## ✅ Estado del Proyecto

### FASE 1 - Completada ✅

- ✅ Docker Compose con PostgreSQL
- ✅ Makefile para comandos rápidos
- ✅ Backend NestJS con arquitectura limpia
- ✅ Prisma ORM con esquema de base de datos
- ✅ Módulo de usuarios con Repository Pattern (SOLID)
- ✅ Módulo de autenticación con JWT
- ✅ Guards y decoradores personalizados (@Public, @Roles, @CurrentUser)
- ✅ Protección contra inyecciones SQL (Prisma)
- ✅ Validación de DTOs con class-validator
- ✅ Frontend React con Vite y TypeScript
- ✅ Context API para autenticación
- ✅ Páginas de Login y Register
- ✅ Rutas protegidas por autenticación y rol
- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ Roles: ADMIN y USER

### FASE 2 - Pendiente ⏳

- ⏳ Unit Tests (mínimo 1)
- ⏳ Integration Tests (mínimo 1)
- ⏳ E2E Tests (mínimo 1)
- ⏳ Coverage ≥85%
- ⏳ Gestión de sesiones wellness
- ⏳ Métricas pre y post sesión
- ⏳ Reportes de impacto

---

## 🛠 Tech Stack

### Backend
- **NestJS 10** - Framework backend con TypeScript
- **Prisma 5** - ORM type-safe
- **PostgreSQL 15** - Base de datos relacional
- **JWT** - Autenticación stateless
- **bcrypt** - Hash de contraseñas (salt: 10)
- **class-validator** - Validación de DTOs
- **Passport** - Estrategias de autenticación

### Frontend
- **React 18** - Framework frontend
- **Vite** - Build tool y dev server
- **TypeScript** - Type safety
- **React Router v6** - Navegación
- **Axios** - Cliente HTTP con interceptors
- **jwt-decode** - Decodificación de tokens

### DevOps
- **Docker & Docker Compose** - Contenedorización
- **Make** - Automatización de comandos

---

## 📦 Prerrequisitos

Asegúrate de tener instalado:

- **Node.js** 18 o superior
- **npm** (viene con Node.js)
- **Docker** y **Docker Compose**
- **Make** (opcional, pero recomendado)
  - macOS: Ya viene instalado
  - Linux: `sudo apt-get install make`
  - Windows: Instalar con WSL2 o usar comandos sin Make

Verifica las instalaciones:

```bash
node --version   # v18.x.x o superior
npm --version    # 9.x.x o superior
docker --version # 20.x.x o superior
make --version   # GNU Make 3.x o superior
```

---

## 🚀 Instalación Rápida (3 minutos)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd fitco

# 2. Levantar base de datos
make up

# 3. Instalar dependencias
make install

# 4. Generar cliente de Prisma y ejecutar migraciones
cd backend
npx prisma generate
npx prisma migrate dev --name init

# 5. Iniciar backend (Terminal 1)
make backend-dev

# 6. Iniciar frontend (Terminal 2)
make frontend-dev

# ✅ Listo! Abre http://localhost:5173
```

---

## ⚙️ Configuración Detallada

### 1. Levantar la Base de Datos

```bash
make up
```

Esto ejecuta `docker-compose up -d` y crea:
- PostgreSQL 15 en puerto `5434` (producción)
- PostgreSQL Test en puerto `5433` (tests - FASE 2)

**Nota:** Si tienes PostgreSQL local corriendo en el puerto 5432, el contenedor usará el puerto 5434 para evitar conflictos.

Verifica que estén corriendo:

```bash
docker ps
```

### 2. Instalar Dependencias

**Con Make:**
```bash
make install
```

**Sin Make:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configurar Variables de Entorno

#### Backend

El archivo `backend/.env` ya existe con valores por defecto:

```env
DATABASE_URL=postgresql://fitco:fitco123@localhost:5434/fitco_db
DATABASE_URL_TEST=postgresql://fitco:fitco123@localhost:5433/fitco_test_db
JWT_SECRET=your-super-secret-key-change-in-production-8a7f6e5d4c3b2a1
JWT_EXPIRES_IN=1d
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** En producción, cambia el `JWT_SECRET` por uno seguro.

#### Frontend

El frontend usa `http://localhost:3000` por defecto. Si necesitas cambiarlo:

```bash
cd frontend
echo "VITE_API_URL=http://localhost:3000" > .env
```

### 4. Configurar Prisma

```bash
cd backend

# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones (crea las tablas en la DB)
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio para ver la DB
npx prisma studio
```

**Con Make:**
```bash
make db-migrate
```

---

## ▶️ Ejecutar el Proyecto

### Opción 1: Con Make (Recomendado)

```bash
# Terminal 1 - Backend
make backend-dev

# Terminal 2 - Frontend  
make frontend-dev
```

### Opción 2: Sin Make

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Prisma Studio** (opcional): `npx prisma studio` en `backend/`

---

## 📁 Estructura del Proyecto

```
fitco/
├── docker-compose.yml              # Configuración de PostgreSQL
├── Makefile                        # Comandos automatizados
├── README.md                       # Descripción del proyecto
├── INSTALLATION.md                 # Este archivo
│
├── backend/                        # Backend NestJS
│   ├── prisma/
│   │   └── schema.prisma          # Modelo: User, Role (ADMIN/USER)
│   │
│   ├── src/
│   │   ├── auth/                  # 🔐 Módulo de Autenticación
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts        # @Public()
│   │   │   │   ├── roles.decorator.ts         # @Roles(Role.ADMIN)
│   │   │   │   └── current-user.decorator.ts  # @CurrentUser()
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts          # Guard global JWT
│   │   │   │   └── roles.guard.ts             # Guard de roles
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts            # Passport JWT Strategy
│   │   │   ├── auth.controller.ts             # POST /auth/login, /auth/register
│   │   │   ├── auth.service.ts                # Lógica de autenticación
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                 # 👥 Módulo de Usuarios
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── interfaces/
│   │   │   │   └── users.repository.interface.ts  # Interfaz (DIP)
│   │   │   ├── users.repository.ts            # Repository Pattern
│   │   │   ├── users.service.ts               # Lógica de negocio
│   │   │   ├── users.controller.ts            # CRUD endpoints
│   │   │   └── users.module.ts
│   │   │
│   │   ├── prisma/                # 🗄️ Servicio de Base de Datos
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts              # Global module
│   │   │
│   │   ├── app.module.ts                     # Módulo principal
│   │   └── main.ts                           # Bootstrap
│   │
│   ├── test/
│   │   └── jest-e2e.json                     # Config E2E (FASE 2)
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
└── frontend/                       # Frontend React
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.tsx            # HOC para rutas protegidas
    │   │
    │   ├── context/
    │   │   └── AuthContext.tsx               # Context API + JWT
    │   │
    │   ├── pages/
    │   │   ├── Login.tsx                     # / 
    │   │   ├── Register.tsx                  # /register
    │   │   ├── Dashboard.tsx                 # /dashboard (USER/ADMIN)
    │   │   └── AdminPanel.tsx                # /admin (ADMIN only)
    │   │
    │   ├── services/
    │   │   └── api.ts                        # Axios + Interceptors
    │   │
    │   ├── styles/
    │   │   ├── Auth.css
    │   │   └── Dashboard.css
    │   │
    │   ├── types/
    │   │   └── auth.types.ts                 # User, Role, AuthResponse
    │   │
    │   ├── App.tsx                           # Router + Routes
    │   ├── main.tsx                          # Entry point
    │   └── index.css                         # Global styles
    │
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 🎯 Comandos Disponibles (Makefile)

### Infraestructura

```bash
make up           # Levantar PostgreSQL con Docker
make down         # Detener contenedores
make clean        # Limpiar volúmenes y datos
make logs         # Ver logs de Docker
```

### Desarrollo

```bash
make install      # Instalar todas las dependencias
make backend-dev  # Iniciar backend (watch mode)
make frontend-dev # Iniciar frontend (HMR)
make dev          # Iniciar ambos simultáneamente
```

### Base de Datos

```bash
make db-migrate   # Ejecutar migraciones de Prisma
make db-seed      # Poblar datos iniciales (cuando exista)
make db-reset     # Reset completo de la DB
```

### Testing (FASE 2 - Próximamente)

```bash
make test-unit    # Unit tests
make test-int     # Integration tests
make test-e2e     # End-to-end tests
make test-all     # Todos los tests
make test-cov     # Reporte de coverage
make test-watch   # Tests en modo watch
```

### Ayuda

```bash
make help         # Ver todos los comandos disponibles
```

---

## 🏗️ Arquitectura y SOLID

### Flujo de Datos

```
HTTP Request
    ↓
Controller (recibe, valida con DTOs)
    ↓
Service (lógica de negocio)
    ↓
Repository (abstracción de datos)
    ↓
Prisma Client
    ↓
PostgreSQL
```

### Principios SOLID Aplicados

#### 1. Single Responsibility Principle (SRP)

Cada clase tiene **una sola razón para cambiar**:

```typescript
// ✅ Controller - Solo maneja HTTP
@Controller('users')
export class UsersController { ... }

// ✅ Service - Solo lógica de negocio
export class UsersService { ... }

// ✅ Repository - Solo acceso a datos
export class UsersRepository { ... }
```

#### 2. Dependency Inversion Principle (DIP)

El servicio depende de una **interfaz**, no de la implementación concreta:

```typescript
// Interface
export interface IUsersRepository {
  create(data: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

// Service depende de la interfaz
export class UsersService {
  constructor(
    private readonly usersRepository: IUsersRepository
  ) {}
}
```

#### 3. Open/Closed Principle

Extendible mediante **decoradores**:

```typescript
// Agregar autenticación
@UseGuards(JwtAuthGuard)

// Agregar control de roles
@Roles(Role.ADMIN)
```

---

## 🔒 Seguridad

### Backend

✅ **Contraseñas hasheadas**
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

✅ **JWT con expiración**
```typescript
signOptions: { expiresIn: '1d' }
```

✅ **Validación de inputs**
```typescript
@IsEmail()
@MinLength(6)
email: string;
```

✅ **Guards para autenticación**
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() { ... }
```

✅ **Guards para autorización**
```typescript
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin-only')
```

✅ **CORS configurado**
```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

✅ **Protección contra SQL Injection** (Prisma usa queries parametrizadas)

### Frontend

✅ **Token en localStorage** con manejo seguro  
✅ **Interceptor de Axios** agrega token automáticamente  
✅ **Redirección automática** en 401 Unauthorized  
✅ **Validación de expiración** de token  

---

## 🌐 Endpoints de la API

### Públicos (sin autenticación)

```bash
GET  /              # Mensaje de bienvenida
GET  /health        # Health check
POST /auth/register # Registro de usuario
POST /auth/login    # Login de usuario
```

**Ejemplo de registro:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Protegidos (requieren JWT en header)

```bash
GET    /auth/profile      # Obtener perfil del usuario actual
GET    /users             # Listar todos los usuarios
GET    /users/:id         # Obtener usuario por ID
PATCH  /users/:id         # Actualizar usuario
DELETE /users/:id         # Eliminar usuario
```

**Ejemplo con autenticación:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎭 Flujo de Autenticación

```
1. Usuario → Formulario de registro/login
       ↓
2. Frontend → POST /auth/register o /auth/login
       ↓
3. Backend → Valida con class-validator
       ↓
4. Backend → Verifica credenciales (bcrypt.compare)
       ↓
5. Backend → Genera JWT token firmado
       ↓
6. Frontend ← { access_token, user }
       ↓
7. Frontend → Guarda token en localStorage
       ↓
8. Frontend → Decodifica token (jwt-decode)
       ↓
9. Frontend → Redirige según rol:
               ADMIN → /admin
               USER → /dashboard
       ↓
10. Requests posteriores incluyen token en header:
    Authorization: Bearer {token}
       ↓
11. Backend → JwtStrategy valida el token
       ↓
12. Backend → RolesGuard verifica permisos
       ↓
13. Backend → Procesa request o retorna 401/403
```

---

## 👥 Roles y Permisos

### USER (por defecto)

- ✅ Acceso a `/dashboard`
- ✅ Ver su propio perfil (`/auth/profile`)
- ❌ No acceso a `/admin`

### ADMIN

- ✅ Acceso a `/dashboard`
- ✅ Acceso a `/admin`
- ✅ Todas las funcionalidades de USER
- ✅ (Futuro) Gestión de sesiones wellness
- ✅ (Futuro) Reportes agregados

---

## 🧪 Testing (FASE 2)

### Estructura de Tests Planificada

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.spec.ts        # Unit test
│   │   └── auth.controller.spec.ts     # Integration test
│   └── users/
│       └── users.service.spec.ts       # Unit test
└── test/
    └── auth.e2e-spec.ts                # E2E test
```

### Comandos de Testing

```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests
```

**Objetivo:** ≥85% Coverage

---

## 🎬 Demo Rápida

### 1. Registrar Usuario

1. Abrir http://localhost:5173
2. Click en "Register here"
3. Completar formulario:
   - Name: `John Doe`
   - Email: `john@test.com`
   - Password: `password123`
4. Automáticamente redirige a `/dashboard` con rol USER

### 2. Crear Usuario ADMIN

Conectarse a PostgreSQL:

```bash
docker exec -it fitco_postgres psql -U fitco -d fitco_db

# Actualizar rol a ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'john@test.com';

# Salir
\q
```

### 3. Probar Acceso como ADMIN

1. Logout en la aplicación
2. Login con `john@test.com`
3. Ahora puedes acceder a `/admin`

---

## 🔧 Troubleshooting

### Error: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :5432
lsof -i :5173

# Matar el proceso
kill -9 <PID>

# O detener Docker
make down
```

### Error: Prisma Client no generado

```bash
cd backend
npx prisma generate
```

### Error: Cannot find module '@prisma/client'

```bash
cd backend
npm install
npx prisma generate
```

### Error: Database does not exist

```bash
# Verificar que Docker esté corriendo
docker ps

# Levantar base de datos
make up

# Ejecutar migraciones
make db-migrate
```

### Error: Token inválido / 401 Unauthorized

En el navegador, abre DevTools → Console:

```javascript
localStorage.clear()
location.reload()
```

### Error: CORS Policy

Verifica que el backend esté configurado con:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

### Error: Connection refused al backend

```bash
# Verificar que el backend esté corriendo
cd backend
npm run start:dev

# Verificar logs
make logs
```

---

## 📚 Recursos Adicionales

### Documentación

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Router](https://reactrouter.com/)
- [JWT](https://jwt.io/)

### Herramientas Útiles

- **Prisma Studio**: `cd backend && npx prisma studio`
- **Postman/Insomnia**: Para probar endpoints
- **React DevTools**: Extensión del navegador

---

## 🎯 Próximos Pasos (FASE 2)

### Testing (OBLIGATORIO)
- [ ] Implementar Unit Tests
- [ ] Implementar Integration Tests
- [ ] Implementar E2E Tests
- [ ] Alcanzar ≥85% coverage

### Funcionalidades del MVP
- [ ] CRUD de sesiones wellness
- [ ] Registro de usuarios a sesiones
- [ ] Métricas pre-sesión (estrés, ánimo, sueño)
- [ ] Métricas post-sesión
- [ ] Reportes de impacto agregado
- [ ] Dashboard con gráficas

---

## 🤝 Contribución

Este proyecto es parte de una prueba técnica. Para cualquier pregunta o sugerencia, contactar al autor.

---

## 👤 Autor

**Ricardo Asin**  
Full Stack Engineer  
Prueba Técnica - FITCO LATAM

---

## 📄 Licencia

Este proyecto es parte de una prueba técnica y es de uso exclusivo para evaluación.

---

**¿Necesitas ayuda?** Revisa la sección de [Troubleshooting](#troubleshooting) o contacta al equipo de desarrollo.

