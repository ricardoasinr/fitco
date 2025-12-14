.PHONY: help up down logs clean install backend-dev frontend-dev dev db-migrate db-seed db-reset test-unit test-int test-e2e test-all test-cov test-watch

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@echo "  make up           - Levantar toda la infraestructura"
	@echo "  make down         - Detener contenedores"
	@echo "  make logs         - Ver logs de servicios"
	@echo "  make clean        - Limpiar volúmenes y rebuild"
	@echo "  make install      - Instalar dependencias (backend y frontend)"
	@echo "  make backend-dev  - Iniciar backend en modo desarrollo"
	@echo "  make frontend-dev - Iniciar frontend en modo desarrollo"
	@echo "  make dev          - Iniciar backend y frontend simultáneamente"
	@echo "  make db-migrate   - Ejecutar migraciones de Prisma"
	@echo "  make db-seed      - Poblar datos iniciales"
	@echo "  make db-reset     - Reset base de datos (para tests)"
	@echo "  make test-unit    - Ejecutar unit tests"
	@echo "  make test-int     - Ejecutar integration tests"
	@echo "  make test-e2e     - Ejecutar e2e tests"
	@echo "  make test-all     - Ejecutar todos los tests"
	@echo "  make test-cov     - Generar reporte de coverage"
	@echo "  make test-watch   - Ejecutar tests en modo watch"

up:
	@echo "🚀 Levantando servicios..."
	docker-compose up -d
	@echo "✅ Servicios levantados. Esperando que PostgreSQL esté listo..."
	@sleep 5
	@echo "✅ Listo!"

down:
	@echo "🛑 Deteniendo servicios..."
	docker-compose down
	@echo "✅ Servicios detenidos"

logs:
	docker-compose logs -f

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
	@echo "🚀 Iniciando backend..."
	cd backend && npm run start:dev

frontend-dev:
	@echo "🚀 Iniciando frontend..."
	cd frontend && npm run dev

dev:
	@echo "🚀 Iniciando desarrollo completo..."
	@make -j2 backend-dev frontend-dev

db-migrate:
	@echo "🔄 Ejecutando migraciones..."
	cd backend && npx prisma migrate dev
	@echo "✅ Migraciones completadas"

db-seed:
	@echo "🌱 Poblando base de datos..."
	cd backend && npx prisma db seed
	@echo "✅ Datos iniciales cargados"

db-reset:
	@echo "🔄 Reseteando base de datos..."
	cd backend && npx prisma migrate reset --force
	@echo "✅ Base de datos reseteada"

test-unit:
	@echo "🧪 Ejecutando unit tests..."
	cd backend && npm run test

test-int:
	@echo "🧪 Ejecutando integration tests..."
	cd backend && npm run test -- --testPathPattern=controller

test-e2e:
	@echo "🧪 Ejecutando e2e tests..."
	cd backend && npm run test:e2e

test-all:
	@echo "🧪 Ejecutando todos los tests..."
	@make test-unit
	@make test-int
	@make test-e2e
	@echo "✅ Todos los tests completados"

test-cov:
	@echo "📊 Generando reporte de coverage..."
	cd backend && npm run test:cov
	@echo "✅ Reporte generado en backend/coverage"

test-watch:
	cd backend && npm run test:watch

