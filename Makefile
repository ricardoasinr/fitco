.PHONY: help up down logs logs-backend logs-frontend logs-db logs-prisma clean install backend-dev frontend-dev dev db-migrate db-seed db-reset db-status db-studio prisma-generate test-unit test-int test-e2e test-all test-cov test-watch

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@echo "  make up           - Levantar toda la infraestructura (Docker)"
	@echo "  make down         - Detener contenedores"
	@echo "  make logs         - Ver logs de todos los servicios"
	@echo "  make logs-backend - Ver logs del backend"
	@echo "  make logs-frontend - Ver logs del frontend"
	@echo "  make logs-db      - Ver logs de la base de datos"
	@echo "  make logs-prisma  - Ver logs de Prisma Studio"
	@echo "  make clean        - Limpiar volúmenes y rebuild"
	@echo "  make install      - Instalar dependencias (backend y frontend)"
	@echo "  make backend-dev  - Ver logs del backend en Docker (ya está corriendo)"
	@echo "  make frontend-dev - Ver logs del frontend en Docker (ya está corriendo)"
	@echo "  make dev          - Ver logs de backend y frontend simultáneamente"
	@echo "  make db-migrate   - Ejecutar migraciones de Prisma (en Docker)"
	@echo "  make db-seed      - Poblar datos iniciales (en Docker)"
	@echo "  make db-reset     - Reset base de datos (en Docker)"
	@echo "  make db-status    - Ver estado de migraciones de Prisma (en Docker)"
	@echo "  make db-studio    - Abrir Prisma Studio (en Docker)"
	@echo "  make prisma-generate - Regenerar Prisma Client (en Docker)"
	@echo "  make test-unit    - Ejecutar unit tests (en Docker)"
	@echo "  make test-int     - Ejecutar integration tests (en Docker)"
	@echo "  make test-e2e     - Ejecutar e2e tests (en Docker)"
	@echo "  make test-all     - Ejecutar todos los tests"
	@echo "  make test-cov     - Generar reporte de coverage (en Docker)"
	@echo "  make test-watch   - Ejecutar tests en modo watch (en Docker)"

up:
	@echo "🚀 Levantando servicios..."
	docker-compose up -d --build
	@echo "✅ Servicios levantados. Esperando que PostgreSQL esté listo..."
	@sleep 5
	@echo "✅ Listo!"
	@echo ""
	@echo "📍 Servicios disponibles:"
	@echo "   - Frontend: http://localhost:5173"
	@echo "   - Backend API: http://localhost:3000"
	@echo "   - Prisma Studio: http://localhost:5555"

down:
	@echo "🛑 Deteniendo servicios..."
	docker-compose down
	@echo "✅ Servicios detenidos"

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

logs-prisma:
	docker-compose logs -f prisma-studio

clean:
	@echo "🧹 Limpiando todo..."
	docker-compose down -v
	@echo "✅ Limpieza completa"

install:
	@echo "📦 Instalando dependencias del backend..."
	cd backend && npm install
	@echo "📦 Instalando dependencias del frontend..."
	cd frontend && npm install
	@echo "✅ Dependencias instaladas"

backend-dev:
	@echo "🚀 Iniciando backend en Docker..."
	@echo "💡 El backend ya está corriendo en Docker. Usa 'make logs-backend' para ver los logs"
	@echo "💡 O ejecuta 'docker-compose up backend' para ver los logs en tiempo real"
	docker-compose up backend

frontend-dev:
	@echo "🚀 Iniciando frontend en Docker..."
	@echo "💡 El frontend ya está corriendo en Docker. Usa 'make logs-frontend' para ver los logs"
	@echo "💡 O ejecuta 'docker-compose up frontend' para ver los logs en tiempo real"
	docker-compose up frontend

dev:
	@echo "🚀 Iniciando desarrollo completo..."
	@echo "💡 Backend y frontend ya están corriendo en Docker. Usa 'make logs' para ver todos los logs"
	docker-compose up backend frontend

db-migrate:
	@echo "🔄 Ejecutando migraciones..."
	docker-compose exec backend npx prisma migrate deploy || docker-compose exec backend npx prisma migrate dev
	@echo "✅ Migraciones completadas"

db-seed:
	@echo "🌱 Poblando base de datos..."
	docker-compose exec backend npm run seed
	@echo "✅ Datos iniciales cargados"

db-reset:
	@echo "🔄 Reseteando base de datos..."
	docker-compose exec backend npx prisma migrate reset --force
	@echo "✅ Base de datos reseteada"

db-status:
	@echo "📊 Verificando estado de migraciones..."
	docker-compose exec backend npx prisma migrate status

db-studio:
	@echo "🎨 Prisma Studio está corriendo en Docker"
	@echo "💡 Disponible en: http://localhost:5555"
	@echo "💡 Ver logs: docker-compose logs -f prisma-studio"
	docker-compose logs -f prisma-studio

prisma-generate:
	@echo "🔧 Regenerando Prisma Client..."
	docker-compose exec backend npx prisma generate
	@echo "✅ Prisma Client regenerado"

test-unit:
	@echo "🧪 Ejecutando unit tests..."
	docker-compose exec backend npm run test

test-int:
	@echo "🧪 Ejecutando integration tests..."
	@echo "📦 Asegurando que la base de datos de test esté corriendo..."
	@docker-compose up -d postgres_test || true
	@sleep 3
	@docker-compose exec -e DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db -e TEST_DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db backend npm run test:integration

test-e2e:
	@echo "🧪 Ejecutando e2e tests..."
	@echo "📦 Asegurando que la base de datos de test esté corriendo..."
	@docker-compose up -d postgres_test || true
	@sleep 3
	@docker-compose exec -e DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db -e TEST_DATABASE_URL=postgresql://fitco:fitco123@postgres_test:5432/fitco_test_db backend npm run test:e2e

test-all:
	@echo "🧪 Ejecutando todos los tests..."
	@make test-unit
	@make test-int
	@make test-e2e
	@echo "✅ Todos los tests completados"

test-cov:
	@echo "📊 Generando reporte de coverage..."
	docker-compose exec backend npm run test:cov
	@echo "✅ Reporte generado en backend/coverage"

test-watch:
	docker-compose exec backend npm run test:watch

