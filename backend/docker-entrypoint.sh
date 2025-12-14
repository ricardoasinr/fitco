#!/bin/sh

echo "🔧 Generando Prisma Client..."
npx prisma generate || echo "⚠️  Advertencia: No se pudo generar Prisma Client"

echo "🔄 Verificando migraciones de Prisma..."

# Esperar un poco para que la base de datos esté lista (docker-compose ya maneja depends_on)
sleep 3

# Intentar aplicar migraciones pendientes (para producción)
# Usar migrate deploy que es idempotente y no falla si ya están aplicadas
if npx prisma migrate deploy 2>&1; then
    echo "✅ Migraciones verificadas/aplicadas"
else
    echo "⚠️  No se pudieron aplicar migraciones automáticamente"
    echo "💡 Ejecuta manualmente: make db-migrate"
fi

# Ejecutar el comando original (sin set -e para que continúe aunque falle)
exec "$@"

