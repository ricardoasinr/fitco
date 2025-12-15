# FITCO Backend API

Backend REST API desarrollado con NestJS para la plataforma FITCO Wellness. Incluye autenticación JWT, gestión de usuarios, y arquitectura basada en principios SOLID.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 15+
- Docker y Docker Compose (opcional, para la base de datos)

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (ver sección Variables de Entorno)
cp .env.example .env

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en modo desarrollo (watch mode)
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

## 📋 Variables de Entorno

Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
DATABASE_URL=postgresql://fitco:fitco123@localhost:5434/fitco_db
DATABASE_URL_TEST=postgresql://fitco:fitco123@localhost:5433/fitco_test_db
JWT_SECRET=your-super-secret-key-change-in-production-8a7f6e5d4c3b2a1
JWT_EXPIRES_IN=1d
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** En producción, cambia el `JWT_SECRET` por uno seguro y aleatorio.

## 🏗️ Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma          # Modelo de datos (User, Role)
├── src/
│   ├── auth/                   # 🔐 Módulo de Autenticación
│   │   ├── auth.controller.ts  # Endpoints: /auth/register, /auth/login, /auth/profile
│   │   ├── auth.service.ts     # Lógica de autenticación y JWT
│   │   ├── auth.module.ts
│   │   ├── dto/                # RegisterDto, LoginDto
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── strategies/         # JwtStrategy (Passport)
│   │   └── decorators/         # @Public(), @CurrentUser(), @Roles()
│   │
│   ├── users/                  # 👥 Módulo de Usuarios
│   │   ├── users.controller.ts # Endpoints: /users (CRUD)
│   │   ├── users.service.ts    # Lógica de negocio
│   │   ├── users.repository.ts # Acceso a datos (Prisma)
│   │   ├── dto/                # CreateUserDto, UpdateUserDto
│   │   └── interfaces/         # IUsersRepository
│   │
│   ├── prisma/                 # 🗄️ Servicio de Prisma
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts   # Cliente de Prisma con lifecycle hooks
│   │
│   ├── app.module.ts           # Módulo raíz
│   ├── main.ts                 # Bootstrap de la aplicación
│   └── app.controller.ts       # Health check y bienvenida
│
└── test/                       # Tests E2E
```

## 🌐 Endpoints de la API

### Base URL
```
http://localhost:3000
```

### Endpoints Públicos (sin autenticación)

#### 1. Health Check
```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "service": "FITCO Backend API"
}
```

#### 2. Bienvenida
```http
GET /
```

---

### Autenticación

#### 3. Registrar Usuario
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Validaciones:**
- `email`: Debe ser un email válido
- `password`: Mínimo 6 caracteres
- `name`: Campo requerido

**Respuesta exitosa (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "USER",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400 Bad Request`: Datos inválidos
- `409 Conflict`: Email ya registrado

#### 4. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "USER",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Credenciales incorrectas

---

### Endpoints Protegidos (requieren JWT)

**⚠️ Todos los endpoints protegidos requieren el header:**
```http
Authorization: Bearer {access_token}
```

#### 5. Obtener Perfil del Usuario Actual
```http
GET /auth/profile
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "role": "USER",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### 6. Listar Todos los Usuarios
```http
GET /users
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "USER",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

**Nota:** Las contraseñas nunca se exponen en las respuestas.

#### 7. Obtener Usuario por ID
```http
GET /users/{id}
Authorization: Bearer {access_token}
```

**Ejemplo:**
```http
GET /users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "role": "USER",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errores posibles:**
- `404 Not Found`: Usuario no encontrado

#### 8. Actualizar Usuario
```http
PATCH /users/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Juan Pérez Actualizado",
  "email": "nuevo@example.com"
}
```

**Campos opcionales:**
- `name`: string
- `email`: string (debe ser un email válido)
- `password`: string (mínimo 6 caracteres, se hashea automáticamente)
- `role`: "ADMIN" | "USER"

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "nuevo@example.com",
  "name": "Juan Pérez Actualizado",
  "role": "USER",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z"
}
```

**Errores posibles:**
- `400 Bad Request`: Datos inválidos
- `404 Not Found`: Usuario no encontrado

#### 9. Eliminar Usuario
```http
DELETE /users/{id}
Authorization: Bearer {access_token}
```

**Respuesta exitosa (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Errores posibles:**
- `404 Not Found`: Usuario no encontrado

---

## 🧪 Probar en Postman

### Configuración Inicial

1. **Crear un Environment en Postman:**
   - Crea un nuevo Environment llamado "FITCO Local"
   - Agrega las siguientes variables:
     - `base_url`: `http://localhost:3000`
     - `token`: (se llenará automáticamente después del login)

2. **Usar variables en las requests:**
   - URL: `{{base_url}}/auth/login`
   - Header Authorization: `Bearer {{token}}`

### Script para Extraer Token Automáticamente

En el **Test** tab de las requests de `register` y `login`, agrega:

```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.access_token) {
        pm.environment.set("token", jsonData.access_token);
        console.log("✅ Token guardado:", jsonData.access_token);
    }
}
```

### Flujo Recomendado de Prueba

1. ✅ **Health Check** → `GET {{base_url}}/health`
   - Verifica que el servidor esté corriendo

2. ✅ **Registrar Usuario** → `POST {{base_url}}/auth/register`
   - Crea un usuario y obtén el token automáticamente

3. ✅ **Obtener Perfil** → `GET {{base_url}}/auth/profile`
   - Verifica que el token funcione correctamente

4. ✅ **Listar Usuarios** → `GET {{base_url}}/users`
   - Obtén la lista de todos los usuarios

5. ✅ **Obtener Usuario por ID** → `GET {{base_url}}/users/{id}`
   - Usa un ID de la lista anterior

6. ✅ **Actualizar Usuario** → `PATCH {{base_url}}/users/{id}`
   - Actualiza los datos del usuario

7. ✅ **Login** → `POST {{base_url}}/auth/login`
   - Prueba el login con las credenciales creadas

8. ✅ **Eliminar Usuario** → `DELETE {{base_url}}/users/{id}`
   - Elimina el usuario (opcional)

### Ejemplo de Collection de Postman

Puedes crear una Collection con las siguientes requests:

```
FITCO API
├── Public
│   ├── Health Check
│   ├── Register
│   └── Login
└── Protected
    ├── Get Profile
    ├── List Users
    ├── Get User by ID
    ├── Update User
    └── Delete User
```

---

## 🔒 Seguridad

### Características Implementadas

✅ **Contraseñas hasheadas** con bcrypt (10 rounds)  
✅ **JWT con expiración** (1 día por defecto)  
✅ **Validación de inputs** con class-validator  
✅ **Guards para autenticación** (JwtAuthGuard)  
✅ **Guards para autorización** (RolesGuard)  
✅ **CORS configurado** para desarrollo  
✅ **Protección contra SQL Injection** (Prisma usa queries parametrizadas)  
✅ **Contraseñas nunca expuestas** en respuestas

### Roles

- **USER**: Usuario estándar (por defecto)
- **ADMIN**: Administrador (acceso completo)

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run start:dev          # Iniciar en modo watch
npm run start:debug        # Iniciar en modo debug
npm run start:prod         # Iniciar en producción

# Base de datos
npx prisma generate        # Generar cliente de Prisma
npx prisma migrate dev     # Ejecutar migraciones
npx prisma studio          # Abrir Prisma Studio (GUI)
npx prisma db seed         # Poblar datos iniciales

# Testing
npm run test               # Ejecutar tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Generar reporte de coverage
npm run test:e2e           # Ejecutar tests E2E

# Linting y Formato
npm run lint               # Ejecutar ESLint
npm run format             # Formatear código con Prettier
```

---

## 🐛 Errores Comunes

### 401 Unauthorized
- **Causa**: Token faltante, inválido o expirado
- **Solución**: Verifica que el header `Authorization: Bearer {token}` esté presente y que el token sea válido

### 400 Bad Request
- **Causa**: Datos inválidos en el body
- **Solución**: Verifica que los campos cumplan las validaciones (email válido, password mínimo 6 caracteres, etc.)

### 404 Not Found
- **Causa**: Endpoint o ID de usuario incorrecto
- **Solución**: Verifica la URL y que el ID exista en la base de datos

### 409 Conflict
- **Causa**: Email ya registrado (en register)
- **Solución**: Usa un email diferente o intenta hacer login

### Error de conexión a la base de datos
- **Causa**: PostgreSQL no está corriendo o DATABASE_URL incorrecta
- **Solución**: 
  ```bash
  # Verificar que Docker esté corriendo
  docker-compose up -d
  
  # Verificar la conexión
  npx prisma db pull
  ```

---

## 🏛️ Arquitectura

### Principios SOLID Aplicados

- **Single Responsibility**: Cada clase tiene una única responsabilidad
- **Open/Closed**: Extensible mediante decoradores y guards
- **Liskov Substitution**: Interfaces bien definidas (IUsersRepository)
- **Interface Segregation**: Interfaces específicas por módulo
- **Dependency Inversion**: Dependencias inyectadas, no instanciadas directamente

### Patrones de Diseño

- **Repository Pattern**: `UsersRepository` abstrae el acceso a datos
- **Strategy Pattern**: `JwtStrategy` para autenticación
- **Guard Pattern**: Guards para autenticación y autorización
- **Decorator Pattern**: Decoradores personalizados (@Public, @Roles, @CurrentUser)

---

## 📚 Tecnologías

- **NestJS**: Framework Node.js
- **TypeScript**: Lenguaje de programación
- **Prisma**: ORM para PostgreSQL
- **Passport**: Autenticación
- **JWT**: Tokens de autenticación
- **bcrypt**: Hash de contraseñas
- **class-validator**: Validación de DTOs
- **PostgreSQL**: Base de datos

---

## 📄 Licencia

Este proyecto es privado y no está licenciado para uso público.

---

## 👤 Autor

**Ricardo Asin**

---

## 🔗 Enlaces Útiles

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Postman](https://learning.postman.com/docs/)

