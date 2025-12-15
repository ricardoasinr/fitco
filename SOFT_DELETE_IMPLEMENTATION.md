# Implementación de Borrado Lógico y Estados de Eventos

## Resumen

Se implementó un sistema de estados y borrado lógico para los eventos, solucionando el problema de eliminación en cascada que borraba todo el historial de registros, asistencias y evaluaciones de bienestar.

## Estados de Eventos

### 1. **Activo** (`isActive: true`, `deletedAt: null`)
- **Visualización**: Se muestra en todos lados (lista pública, administración)
- **Funcionalidad**: Los usuarios pueden inscribirse
- **Comportamiento**: Evento completamente operativo

### 2. **Inactivo** (`isActive: false`, `deletedAt: null`)
- **Visualización**: 
  - **NO** se muestra en la lista pública de eventos
  - **SÍ** se muestra a usuarios que tienen registros en ese evento (historial)
  - **SÍ** se muestra en la administración
- **Funcionalidad**: Los usuarios **NO** pueden inscribirse
- **Comportamiento**: Evento deshabilitado temporalmente pero conserva todos los datos

### 3. **Eliminado** (`deletedAt: fecha`)
- **Visualización**: **NO** se muestra por ningún lado
- **Funcionalidad**: No hay acceso al evento
- **Comportamiento**: Borrado lógico, los datos permanecen en la base de datos pero están ocultos

## Cambios Implementados

### 1. Base de Datos (Prisma Schema)

**Archivo**: `backend/prisma/schema.prisma`

#### Cambios en el modelo Event:
```prisma
model Event {
  // ... otros campos
  isActive        Boolean        @default(true)
  deletedAt       DateTime?      // ✅ NUEVO: Soft delete
  // ... otros campos
}
```

#### Cambios en relaciones (prevenir cascada):
```prisma
// EventInstance
event Event @relation(fields: [eventId], references: [id], onDelete: Restrict)

// Registration
event         Event         @relation(fields: [eventId], references: [id], onDelete: Restrict)
eventInstance EventInstance @relation(fields: [eventInstanceId], references: [id], onDelete: Restrict)
```

### 2. Migración de Base de Datos

**Archivo**: `backend/prisma/migrations/20251214235000_add_soft_delete_to_events/migration.sql`

- Agrega columna `deletedAt` a la tabla `events`
- Cambia `onDelete: CASCADE` a `onDelete: RESTRICT` en todas las relaciones
- Previene eliminación accidental en cascada

**Ejecutar migración**:
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### 3. Backend - Interfaces y Repositorios

#### IEventsRepository
**Archivo**: `backend/src/events/interfaces/events.repository.interface.ts`

Nuevos métodos:
- `findAllNotDeleted()`: Eventos no eliminados (para admin)
- `findActiveAndNotDeleted()`: Eventos activos y no eliminados (para usuarios)
- `findByIdForUser(id, userId?)`: Evento por ID con lógica de visibilidad por usuario
- `softDelete(id)`: Borrado lógico
- `delete(id)`: Eliminación física (mantener por si se necesita)

#### EventsRepository
**Archivo**: `backend/src/events/events.repository.ts`

```typescript
// Filtrar eventos no eliminados
async findAllNotDeleted(): Promise<EventWithRelations[]> {
  return this.prisma.event.findMany({
    where: { deletedAt: null },
    // ...
  });
}

// Filtrar eventos activos y no eliminados
async findActiveAndNotDeleted(): Promise<EventWithRelations[]> {
  return this.prisma.event.findMany({
    where: { 
      isActive: true,
      deletedAt: null 
    },
    // ...
  });
}

// Soft delete
async softDelete(id: string): Promise<Event> {
  return this.prisma.event.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

#### RegistrationsRepository
**Archivo**: `backend/src/registrations/registrations.repository.ts`

Actualizado para filtrar eventos eliminados:
```typescript
async findByUserId(userId: string): Promise<RegistrationWithRelations[]> {
  return this.prisma.registration.findMany({
    where: { 
      userId,
      event: {
        deletedAt: null, // ✅ No mostrar registros de eventos eliminados
      },
    },
    // ...
  });
}
```

### 4. Backend - Services

#### EventsService
**Archivo**: `backend/src/events/events.service.ts`

```typescript
// Para admins: todos los eventos excepto eliminados
async findAll(): Promise<EventWithRelations[]> {
  return this.eventsRepository.findAllNotDeleted();
}

// Para usuarios: solo activos y no eliminados
async findAllActive(): Promise<EventWithRelations[]> {
  return this.eventsRepository.findActiveAndNotDeleted();
}

// Por ID con lógica de visibilidad
async findById(id: string, userId?: string): Promise<EventWithRelations> {
  const event = await this.eventsRepository.findByIdForUser(id, userId);
  if (!event) {
    throw new NotFoundException(`Event with id ${id} not found`);
  }
  return event;
}

// Soft delete por defecto
async delete(id: string): Promise<void> {
  const event = await this.eventsRepository.findById(id);
  if (!event) {
    throw new NotFoundException(`Event with id ${id} not found`);
  }
  await this.eventsRepository.softDelete(id);
}
```

### 5. Backend - DTOs

#### UpdateEventDto
**Archivo**: `backend/src/events/dto/update-event.dto.ts`

Ahora permite actualizar el campo `isActive`:
```typescript
export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['recurrenceType', 'recurrencePattern'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### 6. Frontend - Types

#### Event Interface
**Archivo**: `frontend/src/types/event.types.ts`

```typescript
export interface Event {
  // ... otros campos
  isActive: boolean;
  deletedAt: string | null; // ✅ NUEVO
  // ... otros campos
}

export interface UpdateEventDto {
  // ... otros campos
  isActive?: boolean; // ✅ NUEVO
}
```

## Flujo de Uso

### Como Administrador:

1. **Crear evento**: Estado inicial `isActive: true`, `deletedAt: null`
2. **Desactivar evento**: Actualizar `isActive: false`
   - El evento ya no aparece en lista pública
   - Los usuarios con registros lo siguen viendo en su historial
   - No se pueden hacer nuevas inscripciones
3. **Reactivar evento**: Actualizar `isActive: true`
4. **Eliminar evento**: El DELETE ahora hace soft delete
   - Establece `deletedAt: fecha actual`
   - El evento desaparece completamente de todas las vistas
   - Los datos permanecen en la base de datos

### Como Usuario:

1. **Ver eventos disponibles**: Solo ve eventos con `isActive: true` y `deletedAt: null`
2. **Ver mis registros**: Ve todos los eventos donde está registrado, excepto los eliminados
3. **Inscribirse**: Solo en eventos activos y no eliminados

## Beneficios

1. ✅ **No se pierde historial**: Al eliminar un evento, los registros, asistencias y wellness assessments permanecen
2. ✅ **Control granular**: Tres estados distintos (activo, inactivo, eliminado)
3. ✅ **Reversibilidad**: Los eventos "eliminados" pueden recuperarse si es necesario
4. ✅ **Auditoría**: Se mantiene el historial completo en la base de datos
5. ✅ **UX mejorada**: Los usuarios ven su historial sin eventos eliminados

## Testing Recomendado

1. Crear un evento y registrar usuarios
2. Desactivar el evento (`isActive: false`)
   - Verificar que no aparece en lista pública
   - Verificar que usuarios registrados lo ven en su historial
3. Reactivar el evento
4. Eliminar el evento (soft delete)
   - Verificar que no aparece por ningún lado
   - Verificar que los datos siguen en la base de datos

## Notas Importantes

- El método `permanentDelete()` existe pero no está expuesto en el controller
- Solo usar eliminación física si realmente se necesita limpiar datos
- Los eventos inactivos siguen siendo visibles para usuarios con registros existentes
- Los eventos eliminados NO son visibles para nadie, ni siquiera para admins (se pueden modificar las queries si se necesita)

## Archivos Modificados

### Backend:
- `prisma/schema.prisma`
- `prisma/migrations/20251214235000_add_soft_delete_to_events/migration.sql`
- `src/events/interfaces/events.repository.interface.ts`
- `src/events/events.repository.ts`
- `src/events/events.service.ts`
- `src/events/events.controller.ts`
- `src/events/dto/update-event.dto.ts`
- `src/registrations/registrations.repository.ts`

### Frontend:
- `src/types/event.types.ts`

## Comandos Útiles

```bash
# Ver estado de migraciones
docker-compose exec backend npx prisma migrate status

# Ver datos en Prisma Studio
docker-compose exec backend npx prisma studio

# Logs del backend
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart backend
```

