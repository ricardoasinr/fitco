# 🔐 Configuración de Usuario Administrador

Este documento explica cómo crear y gestionar usuarios administradores en FITCO.

## 📋 Tabla de Contenidos

- [Crear Usuario Admin](#crear-usuario-admin)
- [Configuración Personalizada](#configuración-personalizada)
- [Usar el Token JWT](#usar-el-token-jwt)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Crear Usuario Admin

### Método 1: Usando el Script de Seed (Recomendado)

El script de seed crea automáticamente un usuario administrador y genera un JWT válido.

```bash
# Desde el directorio backend
npm run seed
```

**Resultado:**
```
🌱 Starting seed...

✅ Admin user created successfully!

   Email: admin@fitco.com
   Name: Admin User
   Role: ADMIN
   ID: abc123...

🔑 JWT Token generated:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

📋 Copy this token to use in your requests:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✨ Login credentials:
   Email: admin@fitco.com
   Password: Admin123!

🌱 Seed completed successfully!
```

---

## ⚙️ Configuración Personalizada

Puedes personalizar las credenciales del administrador usando variables de entorno.

### 1. Crear archivo `.env` (si no existe)

```bash
# backend/.env
ADMIN_EMAIL=tu@email.com
ADMIN_PASSWORD=TuPasswordSeguro123!
ADMIN_NAME=Tu Nombre
```

### 2. Ejecutar el seed

```bash
npm run seed
```

---

## 🔑 Usar el Token JWT

Una vez generado el token, puedes usarlo de dos formas:

### Opción 1: Login Normal (Recomendado para el frontend)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fitco.com",
    "password": "Admin123!"
  }'
```

### Opción 2: Usar el Token Directamente (Para pruebas API)

```bash
# Verificar perfil
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Listar usuarios (solo admin)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🛡️ Seguridad

### Endpoints Protegidos

Todos los endpoints de `/users` están protegidos y requieren:

1. **Autenticación**: Token JWT válido
2. **Rol ADMIN**: Solo administradores pueden acceder

```typescript
// ✅ Protegido correctamente
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  
  @Post()
  @Roles(Role.ADMIN)  // Solo admins
  create(@Body() createUserDto: CreateUserDto) {
    // No se puede crear admin desde aquí
    if (createUserDto.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot create admin users via this endpoint');
    }
  }
}
```

### Prevención de Vulnerabilidades

**❌ ANTES (Vulnerable):**
```bash
# Cualquiera podía crear un admin
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacker@evil.com",
    "password": "password",
    "role": "ADMIN"  # ⚠️ Sin validación
  }'
```

**✅ AHORA (Seguro):**
- Endpoint `/users` requiere autenticación
- Solo admins pueden acceder
- No se puede crear admins desde el endpoint público
- Los admins solo se crean vía script de seed

### Registro Público vs Gestión de Usuarios

| Endpoint | Autenticación | Rol Requerido | Puede crear ADMIN |
|----------|---------------|---------------|-------------------|
| `POST /auth/register` | ❌ No | Ninguno | ❌ No (forzado a USER) |
| `POST /users` | ✅ Sí | ADMIN | ❌ No (bloqueado) |
| Seed Script | N/A | N/A | ✅ Sí (único método) |

---

## 🔧 Troubleshooting

### Error: "Admin user already exists"

Si el admin ya existe, el script no lo creará nuevamente pero generará un nuevo JWT.

```bash
⚠️  Admin user already exists with email: admin@fitco.com
🔑 JWT Token generated: ...
```

### Cambiar rol de usuario existente a ADMIN

```bash
# Opción 1: Usar Prisma Studio
npm run prisma:studio
# Buscar el usuario y cambiar role a ADMIN

# Opción 2: SQL directo
psql -U postgres -d fitco_db
UPDATE users SET role = 'ADMIN' WHERE email = 'usuario@example.com';
```

### Error: "Cannot connect to database"

Asegúrate de que PostgreSQL esté corriendo:

```bash
# Verificar que la base de datos esté activa
psql -U postgres -d fitco_db

# O usar Docker si lo tienes configurado
docker ps
```

### Error: "JWT_SECRET not found"

Asegúrate de tener el archivo `.env` con `JWT_SECRET`:

```bash
# backend/.env
JWT_SECRET=tu-secreto-super-seguro-aqui
```

---

## 📚 Ejemplos de Uso

### 1. Crear Admin por Primera Vez

```bash
cd backend
npm run seed
```

### 2. Login como Admin desde el Frontend

```typescript
// En tu componente de React
const response = await api.post('/auth/login', {
  email: 'admin@fitco.com',
  password: 'Admin123!'
});

// El token se guarda automáticamente en localStorage
// Y puedes acceder a rutas de admin
navigate('/admin');
```

### 3. Crear Usuario Normal (como Admin)

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER"
  }'
```

### 4. Intentar Crear Admin desde Endpoint (Bloqueado)

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hacker",
    "email": "hacker@evil.com",
    "password": "password",
    "role": "ADMIN"  # ❌ Esto será bloqueado
  }'

# Respuesta: 403 Forbidden
# "Cannot create admin users via this endpoint. Use the seed script instead."
```

---

## 🎯 Buenas Prácticas

1. **Nunca compartas el JWT en repositorios públicos**
2. **Cambia las credenciales por defecto en producción**
3. **Usa variables de entorno para configuración sensible**
4. **Rota tokens regularmente**
5. **Limita el número de administradores**
6. **Audita las acciones de admin**

---

## 📞 Soporte

Si tienes problemas, revisa:
- Los logs del backend: `npm run start:dev`
- La conexión a la base de datos
- Las variables de entorno en `.env`

---

**Última actualización:** Diciembre 2025

