# FITCO Wellness Impact Platform

**MVP Full-Stack – Prueba Técnica**

## 1. Descripción del Proyecto

**FITCO Wellness Impact Platform** es un **MVP full-stack** que complementa el sistema integral de **FITCO LATAM**, enfocado en la **gestión de sesiones wellness** y en la **medición del impacto real del bienestar** de los usuarios **antes y después** de cada sesión.

El objetivo del proyecto es demostrar:

* Buen criterio de alcance
* Arquitectura limpia
* Correcta aplicación de SOLID
* Seguridad básica
* Testing automatizado
* Capacidad de medir impacto real (no solo gestión)

Este MVP **no pretende ser un producto final**, sino una base sólida, clara y extensible.

---

## 2. Objetivo del Sistema

Construir una aplicación que permita:

* Administrar sesiones wellness (yoga, meditación, spa, charlas)
* Permitir a los usuarios registrarse y asistir a sesiones
* Recopilar métricas de bienestar **pre-sesión y post-sesión**
* Comparar el estado del usuario antes y después de cada actividad
* Visualizar impacto individual y agregado

---

## 3. Alcance Funcional (Scope)

### 3.1 Roles del Sistema

El sistema contempla **dos roles claramente definidos**:

### ADMIN

Responsable de la gestión operativa y del análisis de impacto.

Puede:

* Crear, editar y eliminar sesiones wellness
* Ver usuarios registrados por sesión
* Marcar asistencia a las sesiones
* Visualizar reportes agregados de impacto wellness

---

### USER

Participante de las actividades wellness.

Puede:

* Ver sesiones disponibles
* Registrarse a sesiones
* Completar un **check-in de bienestar pre-sesión**
* Asistir a la sesión
* Completar un **feedback de bienestar post-sesión**
* Visualizar su progreso personal

---

## 3.2 Gestión de Sesiones Wellness

Las sesiones representan actividades como:

* Yoga
* Meditación
* Spa
* Charlas de bienestar

Cada sesión incluye:

* Tipo de sesión
* Fecha y hora
* Capacidad máxima
* Estado de disponibilidad

---

## 3.3 Registro y Asistencia

* El usuario puede registrarse a una sesión disponible.
* El sistema valida:

  * Capacidad
  * Duplicados
* La asistencia es marcada posteriormente.
* Solo los usuarios que **asistieron** pueden completar el feedback post-sesión.

---

## 3.4 Métricas de Bienestar (Pre y Post Sesión)

El sistema mide el impacto wellness mediante **métricas auto-reportadas**, simples y claras, usando una escala **1 a 5**.

### Métricas registradas:

* Nivel de estrés
* Estado de ánimo
* Calidad de sueño

### Flujo de medición:

1. **Pre-sesión**

   * El usuario completa un check-in rápido antes de la sesión.
2. **Post-sesión**

   * El usuario completa el mismo formulario después de asistir.
3. **Impacto**

   * El sistema permite comparar valores pre vs post.

Este enfoque permite medir **impacto real**, no solo participación.

---

## 3.5 Control de Asistencia con QR

El sistema implementa un flujo de asistencia seguro y validado mediante códigos QR:

1. **Generación**: Al registrarse, cada usuario recibe un código QR único para esa sesión.
2. **Validación Pre-Requisito**: El sistema **bloquea** la marca de asistencia si el usuario no ha completado su **check-in de bienestar pre-sesión**.
3. **Escaneo**: El ADMIN utiliza el escáner integrado en la aplicación para leer el QR del usuario.
4. **Confirmación**: Si el usuario cumple los requisitos (Pre-sesión completada), se marca la asistencia exitosa.

---

## 3.6 Gestión Avanzada de Eventos (Soft Delete)

Para garantizar la integridad de los datos históricos y métricas de bienestar, el sistema implementa un manejo de estados robusto:

* **Activo**: Evento visible y disponible para registros.
* **Inactivo**: Evento oculto de la lista pública, pero visible en el historial de los usuarios registrados. No permite nuevos registros.
* **Eliminado (Soft Delete)**: El evento se oculta completamente de la interfaz, pero **persiste en la base de datos**.

**¿Por qué Soft Delete?**
Esto es crítico para una plataforma de impacto. Si se eliminara físicamente un evento, se perderían todas las métricas de bienestar (pre/post) asociadas a él, corrompiendo los reportes históricos de impacto.

---

## 3.7 Reportes

El sistema incluye reportes **básicos y claros**, adecuados para un MVP:

### Para ADMIN:

* Promedios pre-sesión vs post-sesión por actividad
* Impacto agregado por tipo de sesión
* Cantidad de asistentes y feedbacks

### Para USER:

* Evolución personal de bienestar
* Comparación histórica de métricas

No se incluyen dashboards avanzados ni analítica compleja.

---

## 4. Fuera de Alcance (Out of Scope)

Para mantener foco y eficiencia, **no se incluyen**:

* Pagos o suscripciones
* Notificaciones push avanzadas
* Integraciones con wearables
* Multi-tenant avanzado
* Escalabilidad productiva
* Diseño UI avanzado
* Machine Learning

Estas funcionalidades quedan como evolución futura.

---

## 5. Enfoque Técnico

Este proyecto prioriza:

* Arquitectura limpia (Controllers, Services, Repositories)
* Principios SOLID
* Single Responsibility Principle
* Seguridad básica (JWT, roles, validaciones)
* Testing automatizado (unit, integration, e2e)
* Código claro y mantenible

El frontend es funcional y simple; el foco principal está en el **diseño del sistema y la lógica de negocio**.

---

## 6. Criterio de MVP

Este MVP está diseñado para:

* Cumplir estrictamente los requisitos de la prueba técnica
* Ser desarrollado en una sesión continua
* Permitir commits frecuentes
* Ser fácilmente demostrable en una presentación en vivo
* Aceptar cambios rápidos en frontend y backend

---

## 7. Visión a Futuro (No Implementado)

Posibles extensiones futuras:

* Integración con apps de salud
* Métricas avanzadas
* IA para análisis de bienestar
* Multi-sede y multi-cliente
* Notificaciones inteligentes

---

**Autor:**
Ricardo Asin
Full Stack Engineer

---
