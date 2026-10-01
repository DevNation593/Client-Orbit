# Vantex CRM — Frontend gap analysis

Fecha de auditoría: 2026-09-01  
Alcance: Client Orbit, frontend Next.js/React/TypeScript.

## Criterio

Esta auditoría contrasta el frontend actual con el prompt maestro, los documentos 00–08 y los endpoints reales de API Orbit. No se consideran terminadas las funcionalidades que solo tienen datos locales o una pantalla visual sin conexión HTTP.

Estados:

- DONE: funcionalidad conectada a API real, con estados principales de UI.
- PARTIAL: existe una implementación usable, pero faltan partes del flujo o cobertura.
- MISSING: no existe una pantalla o componente funcional.
- BLOCKED_BY_API: el frontend no puede terminarse sin un contrato/backend que todavía no existe.

La aplicación mantiene IDs numéricos para recursos internos y tokens opacos únicamente donde son necesarios para enlaces públicos o invitaciones. No se usa slug como identificador de runtime.

## Inventario funcional

| Área | Estado | Existente | Faltante o riesgo |
|---|---|---|---|
| App shell, sidebar, topbar y tenant switcher | PARTIAL | Shell responsive, breadcrumbs, command palette, quick create, permisos visibles, tenant activo y menú de usuario | Navegación condicionada por flags/plan |
| Autenticación y sesiones | DONE | Login, registro, logout, recuperación, invitaciones y cookie HttpOnly | MFA y gestión de sesiones activas no están expuestos por API |
| RBAC y permisos | DONE | Can, menús y acciones condicionadas por permisos | Matriz editable de permisos y field-level permissions |
| Contactos | DONE | CRUD, filtros, paginación, campos personalizados, acciones rápidas, preferencias de búsqueda/columnas y API real | Vistas guardadas compartidas |
| Customer 360 | DONE | Detalle, propiedades, organizaciones, actividad filtrable, relaciones, oportunidades, tareas, archivos y acciones rápidas | Endpoint agregado y paginación server-side para escalar volúmenes |
| Timeline y actividades | PARTIAL | Componente reusable, filtros All/Messages/Sales/Activities/System y composer para notas/llamadas/reuniones/correos | Paginación y asociación server-side por registro |
| Organizaciones | DONE | CRUD, contactos relacionados y campos personalizados | Timeline y acciones 360 |
| Leads | PARTIAL | CRUD, filtros, detalle y conversión a contacto/organización/deal | Score explicable, routing, campañas y actividad 360 |
| Oportunidades y pipelines | PARTIAL | CRUD, pipeline/stage, Kanban, cambio de etapa y validación backend | Rollback optimista explícito, detalle enriquecido, productos, cotizaciones y forecast |
| Tareas | DONE | CRUD, filtros, estados, prioridad, responsable y vencimiento | Calendario y relaciones navegables |
| Archivos | PARTIAL | Listado, carga, descarga y eliminación | Asociación desde fichas y progreso de jobs |
| Campos personalizados y formularios dinámicos | DONE | CRUD de definiciones, renderer por tipos y validación cliente | Reglas visuales avanzadas, layout y permisos por campo |
| Entidades personalizadas y registros | DONE | Definiciones, campos, CRUD de registros y rutas por IDs | Layout builder, vistas y permisos configurables |
| Relaciones | DONE | Selector de registros core/custom, creación, eliminación, validación tenant y vista embebida en Customer 360 | Filtros server-side por registro |
| Automatizaciones | PARTIAL | Builder declarativo básico, CRUD y estado | Historial de ejecuciones, retries y builder de condiciones avanzado |
| Importaciones/exportaciones | PARTIAL | Pantalla de datos y consumo de endpoints | Estado de job completo, errores descargables y progreso en tiempo real |
| Auditoría | DONE | Visor conectado a API | Filtros avanzados y exportación |
| Integraciones | PARTIAL | Catálogo, credenciales cifradas en backend, health/connect/disconnect y endpoints webhook | OAuth, sincronización por proveedor y panel de deliveries |
| Búsqueda global | DONE | Resultados reales agrupados de contactos, organizaciones, leads, oportunidades y tareas, con deep links y estados de carga/error | Endpoint unificado para relevancia y paginación |
| Command palette | DONE | Ctrl/Cmd+K, navegación y acciones de creación condicionadas por permisos | Catálogo de acciones administrable |
| Notificaciones | PARTIAL | Panel visual local | Endpoint de preferencias, persistencia, deep links y Reverb/Echo |
| Inbox/email/WhatsApp | BLOCKED_BY_API | — | No existen recursos ni endpoints de conversaciones/mensajes |
| Formularios públicos y submissions | BLOCKED_BY_API | — | Falta contrato de forms, publicación y submissions |
| Sequences y meeting scheduler | BLOCKED_BY_API | — | Falta dominio, disponibilidad, calendarios y reservas |
| Productos, price lists y quotes | BLOCKED_BY_API | — | No existen recursos de catálogo/cotización |
| Forecast, goals y analytics avanzados | BLOCKED_BY_API | Reportes básicos | Faltan agregaciones y contratos de filtros/widgets |
| Playbooks, territorios y campañas | BLOCKED_BY_API | — | Faltan endpoints de configuración y ejecución |
| Service, tickets, SLA y knowledge base | BLOCKED_BY_API | — | Faltan recursos, estados y métricas |
| Portal de clientes y customer success | BLOCKED_BY_API | — | Requiere autenticación/contrato separado |
| Data quality y merge de duplicados | BLOCKED_BY_API | — | Falta detección, comparación y endpoint transaccional de merge |
| Dashboard/report builder | BLOCKED_BY_API | Dashboard/reportes básicos | Faltan metadata, queries guardadas y widgets |
| API keys, ERP y Vantex AI | BLOCKED_BY_API | — | Faltan contratos de seguridad, ERP y capacidades AI |

## Orden de trabajo

### P0 disponible con la API actual

Los cuatro bloques P0 disponibles con los endpoints actuales quedaron implementados:

1. Customer 360 con datos de contactos, actividades, oportunidades, tareas, relaciones y archivos existentes.
2. ActivityTimeline con filtros y composer reutilizable.
3. GlobalSearch con resultados reales agrupados y deep links.
4. Preferencias por tenant para visibilidad de columnas, búsquedas y filtros disponibles.

El siguiente bloque es escalar timeline, relaciones y archivos con filtros server-side y paginación.

### P0/P1 bloqueado por API

Se registran contratos propuestos en 12-FRONTEND-API-REQUIREMENTS.md. El frontend no crea endpoints falsos ni reemplaza datos faltantes con mocks.

## Definition of Done aplicada

Una pantalla se marca como terminada únicamente cuando consume el API real, tipa la respuesta, maneja loading/empty/error/forbidden, respeta permisos, funciona en viewport móvil y tiene una prueba adecuada o queda cubierta por una prueba de integración/E2E existente.
