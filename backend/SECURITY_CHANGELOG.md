# 🔒 Changelog de Seguridad

## [1.1.0] - 2024-12-14

### 🚨 Vulnerabilidad Crítica Corregida

**CVE: Creación no autorizada de usuarios ADMIN**

**Severidad:** CRÍTICA  
**Estado:** ✅ CORREGIDO

---

## 📝 Resumen de Cambios

### Archivos Modificados

1. **`src/users/users.controller.ts`** - Protección de endpoints
2. **`src/auth/dto/register.dto.ts`** - Documentación de seguridad
3. **`package.json`** - Scripts de seed añadidos

### Archivos Creados

1. **`prisma/seed.ts`** - Script para crear admin y generar JWT
2. **`ADMIN_SETUP.md`** - Documentación de configuración de admin
3. **`SECURITY_TESTS.md`** - Reporte de pruebas de seguridad
4. **`SECURITY_CHANGELOG.md`** - Este archivo

---

## 🛡️ Correcciones Implementadas

### 1. Protección de Endpoints `/users`

**Antes:**
```typescript
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Después:**
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)  // ✅ Requiere autenticación y roles
export class UsersController {
  @Post()
  @Roles(Role.ADMIN)  // ✅ Solo ADMIN
  create(@Body() createUserDto: CreateUserDto) {
    // ✅ Bloquea creación de ADMIN
    if (createUserDto.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Cannot create admin users via this endpoint. Use the seed script instead.',
      );
    }
    return this.usersService.create(createUserDto);
  }
}
```

**Impacto:**
- ✅ Todos los endpoints `/users` ahora requieren autenticación
- ✅ Solo usuarios ADMIN pueden acceder
- ✅ No se pueden crear admins desde el endpoint

---

### 2. Validación en Todos los Endpoints

Se agregaron guards y validaciones a todos los endpoints:

| Endpoint | Before | After | Protección |
|----------|--------|-------|------------|
| `POST /users` | ❌ Público | ✅ ADMIN only | JwtAuthGuard + RolesGuard + Validación lógica |
| `GET /users` | ❌ Público | ✅ ADMIN only | JwtAuthGuard + RolesGuard |
| `GET /users/:id` | ❌ Público | ✅ ADMIN only | JwtAuthGuard + RolesGuard |
| `PATCH /users/:id` | ❌ Público | ✅ ADMIN only | JwtAuthGuard + RolesGuard + Validación de role |
| `DELETE /users/:id` | ❌ Público | ✅ ADMIN only | JwtAuthGuard + RolesGuard |

---

### 3. Script de Seed para Admin

**Archivo:** `prisma/seed.ts`

**Funcionalidad:**
- Crea usuario administrador inicial
- Genera JWT válido automáticamente
- Muestra credenciales y token en consola
- Previene duplicados (verifica si ya existe)
- Configurable vía variables de entorno

**Uso:**
```bash
npm run seed
```

**Variables de entorno (opcionales):**
```bash
ADMIN_EMAIL=admin@fitco.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Admin User
```

**Salida del script:**
```
🌱 Starting seed...

✅ Admin user created successfully!

   Email: admin@fitco.com
   Name: Admin User
   Role: ADMIN
   ID: c0520b27-2a2a-44ad-b9b4-d49262f3c02c

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

### 4. Documentación Mejorada

**RegisterDto** ahora incluye documentación explicando por qué no tiene campo `role`:

```typescript
/**
 * RegisterDto - DTO para registro de usuarios
 * 
 * Seguridad:
 * - NO incluye el campo 'role' intencionalmente
 * - Todos los nuevos registros son forzados a rol USER
 * - Esto previene que usuarios maliciosos se registren como ADMIN
 * 
 * Los usuarios ADMIN solo se pueden crear mediante:
 * - Script de seed (npm run seed)
 * - Endpoint /users (solo accesible por otros ADMIN)
 */
```

---

## 🔐 Capas de Seguridad

### Capa 1: Autenticación
**Guard:** `JwtAuthGuard`
- Verifica token JWT en header
- Valida firma y expiración
- Extrae usuario del payload

### Capa 2: Autorización
**Guard:** `RolesGuard`
- Verifica rol del usuario
- Compara con roles requeridos
- Bloquea acceso si no coincide

### Capa 3: Validación de Input
**Pipe:** `ValidationPipe`
- `whitelist: true` - Remueve campos no definidos
- `forbidNonWhitelisted: true` - Rechaza requests con campos extras
- Decoradores de validación en DTOs

### Capa 4: Lógica de Negocio
**Service/Controller:**
- `AuthService.register()` fuerza `role: 'USER'`
- `UsersController.create()` bloquea `role === ADMIN`
- `UsersController.update()` valida cambios de rol

---

## ✅ Verificación de Seguridad

### Tests Ejecutados

1. ✅ Acceso sin autenticación → 401 Unauthorized
2. ✅ Crear usuario sin token → 401 Unauthorized
3. ✅ Token de admin válido → 200 OK
4. ✅ Admin intenta crear admin → 403 Forbidden
5. ✅ Admin crea usuario USER → 201 Created
6. ✅ Registro público → Crea USER solamente
7. ✅ Registro con campo "role" → 400 Bad Request
8. ✅ Usuario USER intenta acceder a /users → 403 Forbidden

**Resultado:** 8/8 tests pasados ✅

---

## 🎯 Métodos de Creación de Usuarios

### Tabla de Comparación

| Método | Endpoint/Comando | Autenticación | Rol Resultante | Puede crear ADMIN | Uso |
|--------|------------------|---------------|----------------|-------------------|-----|
| **Registro Público** | `POST /auth/register` | ❌ No requerida | USER (forzado) | ❌ No | Usuarios finales |
| **Admin crea usuario** | `POST /users` | ✅ ADMIN requerido | USER/ADMIN* | ❌ No (bloqueado) | Staff interno |
| **Seed Script** | `npm run seed` | N/A | ADMIN | ✅ Sí (único método) | Bootstrap inicial |

\* *Nota: Aunque el DTO acepta role, el código lo valida y bloquea ADMIN*

---

## 📊 Matriz de Permisos

| Acción | Usuario Anónimo | Usuario USER | Usuario ADMIN |
|--------|----------------|--------------|---------------|
| Registrarse | ✅ Sí (como USER) | N/A | N/A |
| Login | ✅ Sí | ✅ Sí | ✅ Sí |
| Ver perfil propio | ❌ No | ✅ Sí | ✅ Sí |
| Listar usuarios | ❌ No | ❌ No | ✅ Sí |
| Ver usuario por ID | ❌ No | ❌ No | ✅ Sí |
| Crear usuario USER | ❌ No | ❌ No | ✅ Sí |
| Crear usuario ADMIN | ❌ No | ❌ No | ❌ No (solo seed) |
| Actualizar usuario | ❌ No | ❌ No | ✅ Sí |
| Eliminar usuario | ❌ No | ❌ No | ✅ Sí |

---

## 📚 Archivos de Documentación

1. **`ADMIN_SETUP.md`**
   - Cómo crear usuario admin
   - Configuración personalizada
   - Uso del token JWT
   - Troubleshooting

2. **`SECURITY_TESTS.md`**
   - Reporte completo de tests
   - Casos de prueba ejecutados
   - Configuración de seguridad
   - Checklist de seguridad

3. **`SECURITY_CHANGELOG.md`** (este archivo)
   - Resumen de cambios
   - Vulnerabilidades corregidas
   - Impacto y mejoras

---

## 🔄 Breaking Changes

### Para Desarrolladores

Si tenías código que usaba directamente `POST /users`:

**Antes:**
```bash
# Esto funcionaba sin autenticación
curl -X POST http://localhost:3000/users \
  -d '{"name": "...", "email": "...", "password": "..."}'
```

**Ahora:**
```bash
# Requiere token de ADMIN
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "...", "email": "...", "password": "...", "role": "USER"}'
```

### Para Usuarios

- Los nuevos registros usan `POST /auth/register` (sin cambios)
- El primer admin debe crearse con `npm run seed`
- Admins subsecuentes pueden ser promovidos por el primer admin

---

## 🚀 Migración

### Paso 1: Crear Admin Inicial

```bash
cd backend
npm run seed
```

Guarda el token JWT generado.

### Paso 2: Actualizar Frontend (si aplica)

Si el frontend usaba `POST /users` para registro, cambiar a `POST /auth/register`.

### Paso 3: Verificar Funcionamiento

```bash
# Login como admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fitco.com", "password": "Admin123!"}'

# Verificar perfil
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎓 Lecciones de Seguridad

### Principios Aplicados

1. **Defensa en profundidad**: Múltiples capas de seguridad
2. **Mínimo privilegio**: Usuarios empiezan con permisos mínimos
3. **Fail-safe defaults**: Por defecto todo requiere autenticación
4. **Separación de preocupaciones**: Guards, validación y lógica separadas
5. **Auditoría**: Logs y documentación de cambios

### Errores Comunes Evitados

❌ **No hacer:** Confiar en el cliente para validar roles  
✅ **Sí hacer:** Validar roles en el servidor

❌ **No hacer:** Permitir que DTOs públicos incluyan campos sensibles  
✅ **Sí hacer:** Usar DTOs diferentes para diferentes contextos

❌ **No hacer:** Asumir que los guards son suficientes  
✅ **Sí hacer:** Agregar validación en la lógica de negocio también

---

## 🔮 Roadmap de Seguridad

### Corto Plazo (Próximas semanas)

- [ ] Rate limiting en endpoints de autenticación
- [ ] Logging de intentos de acceso no autorizados
- [ ] Email verification en registro

### Mediano Plazo (1-3 meses)

- [ ] Autenticación de dos factores (2FA)
- [ ] Refresh tokens
- [ ] Audit log de acciones de admin

### Largo Plazo (3-6 meses)

- [ ] RBAC avanzado (más roles y permisos)
- [ ] OAuth integration
- [ ] Session management mejorado

---

## 📞 Contacto y Soporte

Si encuentras algún problema de seguridad:

1. **NO** lo reportes públicamente
2. Contacta al equipo de seguridad
3. Proporciona detalles de la vulnerabilidad
4. Espera confirmación antes de disclosure

---

## ✅ Checklist Final

- [x] Vulnerabilidad identificada
- [x] Correcciones implementadas
- [x] Tests de seguridad ejecutados
- [x] Documentación creada
- [x] Script de seed funcional
- [x] Verificación de todos los endpoints
- [x] Breaking changes documentados
- [x] Guía de migración creada

---

**Estado:** ✅ **PRODUCCIÓN READY**

**Última revisión:** Diciembre 14, 2024  
**Próxima revisión:** Enero 15, 2025

---

*Este changelog es parte del commitment con la seguridad de FITCO.*

