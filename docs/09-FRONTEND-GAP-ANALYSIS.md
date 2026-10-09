# Vantex CRM — Frontend gap analysis

Fecha de auditoría: 2026-10-09 (sustituye a la del 2026-09-01)  
Alcance: Client Orbit, frontend Next.js/React/TypeScript.  
API de referencia: rama `dev` de API Orbit tras la fusión de API-1 a API-7.2 (525 rutas, 304 paths en OpenAPI).

## Criterio

Esta auditoría contrasta el frontend actual con el prompt maestro, los documentos 00–08 y los endpoints reales de API Orbit. No se consideran terminadas las funcionalidades que solo tienen datos locales o una pantalla visual sin conexión HTTP.

Estados:

- DONE: funcionalidad conectada a API real, con estados principales de UI.
- PARTIAL: existe una implementación usable, pero faltan partes del flujo o cobertura.
- MISSING: no existe una pantalla o componente funcional. El API necesario ya existe.
- BLOCKED_BY_API: el frontend no puede terminarse sin un contrato/backend que todavía no existe.

La aplicación mantiene IDs numéricos para recursos internos. Los enlaces públicos usan el UUID `public_id` que expone el API (formularios, reuniones, cotizaciones, base de conocimiento) o tokens opacos (invitaciones, preferencias de consentimiento). No se usa slug como identificador de runtime.

## Qué cambió desde la auditoría anterior

La auditoría del 2026-09-01 marcaba como `BLOCKED_BY_API` casi todo lo que no era CRM base. Desde entonces el backend entregó las fases API-1 a API-7.2, así que esos módulos pasan a `MISSING`: el contrato existe y lo que falta es la pantalla. El frontend no cambió en ese periodo.

Además, varias pantallas del CRM base siguen usando los rodeos anteriores a API-1 aunque el endpoint dedicado ya está disponible. Se indican en la columna «Faltante o riesgo».

## Inventario funcional — CRM base

| Área | Estado | Existente | Faltante o riesgo |
|---|---|---|---|
| App shell, sidebar, topbar y tenant switcher | PARTIAL | Shell responsive, breadcrumbs, command palette, quick create, permisos visibles, tenant activo y menú de usuario | Navegación por módulos habilitados. El API no expone flags ni planes (ver BLOCKED_BY_API) |
| Autenticación y sesiones | DONE | Login, registro, logout, recuperación, invitaciones y cookie HttpOnly | MFA y gestión de sesiones activas no están expuestos por API |
| RBAC y permisos | DONE | Can, menús y acciones condicionadas por permisos | Matriz editable de permisos y field-level permissions |
| Contactos | DONE | CRUD, filtros, paginación, campos personalizados, acciones rápidas, preferencias de búsqueda/columnas y API real | Vistas guardadas (`/saved-views`) y etiquetas (`/tags`): API disponible, sin consumir |
| Customer 360 | DONE | Ficha del contacto alimentada por `GET /contacts/{id}/overview`: oportunidades, tareas, relaciones y archivos con total por módulo; los módulos sin permiso no se muestran | Leads, conversaciones y cotizaciones que el overview ya devuelve; enlace «ver todos» cuando hay más de 10 |
| Timeline y actividades | DONE | Timeline del contacto desde `GET /contacts/{id}/timeline`: actividad, eventos de dominio, auditoría y cotizaciones, con carga de páginas anteriores, filtros por categoría y composer | Los filtros se aplican a lo ya cargado; el API solo filtra por `source` y `event`. La página `/activities` sigue usando el listado general |
| Duplicados y fusión | MISSING | — | `POST /contacts/duplicate-check`, `POST /contacts/{id}/merge` y equivalentes en `/companies` |
| Organizaciones | DONE | CRUD, contactos relacionados y campos personalizados | Timeline y acciones 360 |
| Leads | PARTIAL | CRUD, filtros, detalle y conversión a contacto/organización/deal | Score explicable (`/leads/{id}/scores`), routing (`/leads/{id}/route`, `/routing-executions`) y actividad 360 |
| Oportunidades y pipelines | PARTIAL | CRUD, pipeline/stage, Kanban, cambio de etapa y validación backend | Rollback optimista explícito, detalle enriquecido, productos, cotizaciones y forecast |
| Tareas | DONE | CRUD, filtros, estados, prioridad, responsable y vencimiento | Calendario y relaciones navegables |
| Archivos | PARTIAL | Listado, carga, descarga y eliminación | Asociación desde fichas. `GET /files` sigue sin filtro por registro relacionado |
| Campos personalizados y formularios dinámicos | DONE | CRUD de definiciones, renderer por tipos y validación cliente | Reglas visuales avanzadas, layout y permisos por campo |
| Entidades personalizadas y registros | DONE | Definiciones, campos, CRUD de registros y rutas por IDs | Layout builder, vistas y permisos configurables |
| Relaciones | DONE | Selector de registros core/custom, creación, eliminación, validación tenant y vista embebida en Customer 360 | Filtros server-side por registro |
| Automatizaciones | PARTIAL | Builder declarativo básico, CRUD y estado | Historial de ejecuciones y reintentos: el API solo expone el CRUD |
| Importaciones/exportaciones | PARTIAL | Pantalla de datos y consumo de endpoints | Seguimiento del job con `GET /imports/{id}` y `GET /exports/{id}`; errores descargables |
| Auditoría | DONE | Visor conectado a API | Filtros avanzados y exportación |
| Integraciones | PARTIAL | Catálogo, credenciales cifradas en backend, health/connect/disconnect y endpoints webhook | OAuth interactivo y panel de entregas de webhooks: sin endpoint |
| Búsqueda global | DONE | `GET /search` con ranking y permisos en backend: contactos, organizaciones, leads, oportunidades, documentos y registros personalizados, agrupados y con deep links | Las tareas no están en `/search` y se consultan aparte; los documentos enlazan al listado porque no tienen ficha |
| Command palette | DONE | Ctrl/Cmd+K, navegación y acciones de creación condicionadas por permisos | Catálogo de acciones administrable |
| Notificaciones | PARTIAL | Panel visual local | Conectar `/notifications`, `/notifications/unread-count`, `/notification-preferences` y los canales privados de Reverb. No hay cliente de websockets instalado |

## Inventario funcional — Módulos con API disponible y sin pantalla

| Área | Estado | Endpoints principales | Notas |
|---|---|---|---|
| Inbox omnicanal | MISSING | `/inboxes`, `/conversations`, `/conversations/{id}/messages`, `/canned-responses` | Asignación, lectura y estado por `PATCH`. Tiempo real por Reverb |
| Correo | MISSING | `/email/accounts`, `/email/templates` | Tracking de apertura y clic gestionado por el API |
| WhatsApp | MISSING | `/whatsapp/accounts`, `/whatsapp/accounts/{id}/templates` | Diferenciar mensaje libre y plantilla aprobada |
| Formularios y envíos | MISSING | `/forms`, `/forms/{id}/submissions` | Página pública por UUID: `/public/forms/{publicId}` |
| Routing de leads | MISSING | `/lead-routing-rules` | Constructor de reglas declarativas |
| Scoring de leads | MISSING | `/scoring-models`, `/scoring-rules` | — |
| Secuencias | MISSING | `/sequences`, `/sequence-enrollments` | Pausar, reanudar y detener enrolamientos |
| Agenda de reuniones | MISSING | `/meeting-types`, `/meeting-bookings`, `/calendar-connections` | Páginas públicas por UUID: `/public/meetings/{publicId}` |
| Productos y catálogo | MISSING | `/products`, `/product-categories`, `/bundles`, `/taxes`, `/discounts`, `/currencies` | — |
| Listas de precios y CPQ | MISSING | `/price-lists`, `/cpq` | — |
| Cotizaciones | MISSING | `/quotes` y sus acciones (`submit`, `approve`, `send`, `accept`, `revise`, `pdf`) | Vista pública por UUID: `/public/quotes/{publicId}` |
| Aprobaciones | MISSING | `/approval-processes`, `/approval-requests`, `/approval-delegations` | Componente `ApprovalTimeline` reutilizable |
| Sincronización ERP | MISSING | `/erp/syncs`, `/quotes/{id}/sync-erp` | Solo estado de sincronización (ver BLOCKED_BY_API para datos del ERP) |
| Forecast | MISSING | `/forecast`, `/forecast/users`, `/forecast/teams`, `/forecast/snapshots` | — |
| Metas | MISSING | `/goals` y `/goals/{id}/targets` | — |
| Analítica comercial | MISSING | `/sales-analytics` | — |
| Estructura comercial | MISSING | `/branches`, `/sales-teams`, `/territories`, `/territory-rules`, `/territory-assignments` | — |
| Playbooks | MISSING | `/playbooks`, `/playbook-executions` | Modo guiado para vendedores |
| Segmentos y audiencias | MISSING | `/segments` (incluye `/segments/preview` y `/segments/fields`), `/audiences` | La estimación de audiencia sale de `preview` |
| Campañas | MISSING | `/campaigns` y `/campaigns/{id}/metrics` | — |
| Consentimiento | MISSING | `/consents`, `/consent-links` | Centro público de preferencias: `/public/preferences/{token}` |
| Journeys | MISSING | `/journeys` (versiones, publicación, enrolamientos) | Reutilizar piezas del builder de automatizaciones |
| Tickets | MISSING | `/tickets`, `/tickets/{id}/comments`, `/tickets/{id}/status`, `/tickets/{id}/assign` | — |
| SLA | MISSING | `/tickets/{id}/sla`, `/support/sla-policies`, `/support/sla-calendars`, `/support/sla-escalations` | Temporizadores de primera respuesta y de resolución |
| Configuración de soporte | MISSING | `/support/agents`, `/support/categories`, `/support/queues` | — |
| Base de conocimiento | MISSING | `/knowledge/articles` (versiones, publicación), `/knowledge/categories`, `/knowledge/tags`, `/knowledge/settings` | Vista pública por UUID: `/public/knowledge/{basePublicId}` |
| Calendario | MISSING | Se compone con `/meeting-bookings` y `/tasks` | No hay endpoint unificado de calendario |

## Inventario funcional — Bloqueado por API

| Área | Estado | Qué falta en el backend |
|---|---|---|
| Portal de clientes | BLOCKED_BY_API | En desarrollo en la rama `feature/api-7-3a-customer-portal` (administración e invitaciones); falta login, perfil y contenido |
| Customer Success y health score | BLOCKED_BY_API | Sin modelos ni endpoints |
| Encuestas NPS/CSAT | BLOCKED_BY_API | Sin modelos ni endpoints |
| Panel de servicio | BLOCKED_BY_API | No hay endpoint de métricas agregadas de tickets y SLA |
| Data Quality Center | BLOCKED_BY_API | Existe detección y fusión de duplicados, pero no el panel agregado (emails inválidos, registros incompletos, sin propietario) |
| Dashboard builder y report builder | BLOCKED_BY_API | Sin metadata, consultas guardadas ni widgets |
| API keys y apps de desarrollador | BLOCKED_BY_API | Sin modelo de apps, scopes ni credenciales |
| Historial de automatizaciones | BLOCKED_BY_API | `/automations` solo expone CRUD |
| Entregas de webhooks y rotación de secreto | BLOCKED_BY_API | `/webhooks/endpoints` solo expone CRUD |
| OAuth de integraciones | BLOCKED_BY_API | Sin endpoint de URL de autorización ni estado de sincronización |
| Datos del ERP en la ficha (pedidos, facturas, saldo) | BLOCKED_BY_API | Solo existe el estado de sincronización |
| CRM Builder: layouts, reglas de validación, fórmulas | BLOCKED_BY_API | API-8 pendiente |
| Plantillas por industria | BLOCKED_BY_API | API-8 pendiente |
| Plantillas de documentos | BLOCKED_BY_API | Solo existen plantillas de correo |
| Feature flags y límites de plan | BLOCKED_BY_API | El API no expone flags ni uso/límites |
| Acciones masivas | BLOCKED_BY_API | No hay endpoints de operación masiva |
| Vantex AI | BLOCKED_BY_API | API-10 pendiente |

## Orden de trabajo

El orden y los criterios de cierre están en el plan de cierre del proyecto (`Documentos/PLAN-DE-CIERRE.md`, fuera de este repositorio). En resumen:

1. Cerrar el CRM base con los endpoints que ya existen: overview y timeline del contacto, `/search`, vistas guardadas, etiquetas, duplicados y notificaciones reales.
2. Trabajo transversal previo a los módulos nuevos: generar los tipos TypeScript desde `openapi.yaml`, añadir el cliente de tiempo real y hacer la navegación dependiente de módulos habilitados.
3. Módulos con API disponible, en bloques: inbox y canales, cotizaciones, captación, rendimiento comercial, servicio y marketing.

Los contratos que siguen faltando están en 12-FRONTEND-API-REQUIREMENTS.md. El frontend no crea endpoints falsos ni reemplaza datos faltantes con mocks.

## Definition of Done aplicada

Una pantalla se marca como terminada únicamente cuando consume el API real, tipa la respuesta, maneja loading/empty/error/forbidden, respeta permisos, funciona en viewport móvil y tiene una prueba adecuada o queda cubierta por una prueba de integración/E2E existente.
