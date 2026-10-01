# Vantex CRM — Módulos frontend

Este inventario describe las rutas actuales de Client Orbit, su fuente de datos y el estado de entrega. El frontend usa App Router, TanStack Query para server state, Zustand solo para sesión/tenant y componentes compartidos en src/components.

## Módulos conectados

| Módulo | Rutas | API consumida | Estado |
|---|---|---|---|
| Dashboard | / | contacts, leads, deals, tasks, activities | PARTIAL |
| Contactos | /contacts, /contacts/new, /contacts/[id] | /contacts, /field-definitions, /activities | PARTIAL |
| Organizaciones | /organizations, /organizations/new, /organizations/[id] | /organizations, /field-definitions | DONE |
| Leads | /leads, /leads/new, /leads/[id] | /leads, /leads/{id}/convert | PARTIAL |
| Oportunidades | /deals, /deals/new, /deals/[id] | /deals, /pipelines, /field-definitions | PARTIAL |
| Pipelines | /pipelines | /pipelines | DONE |
| Tareas | /tasks, /tasks/new, /tasks/[id] | /tasks, /field-definitions | DONE |
| Actividad | /activities | /activities | PARTIAL |
| Entidades custom | /entities, /entities/[entityId], /entities/[entityId]/new, /entities/[entityId]/[recordId] | /entity-definitions, /entities/{id}/records, /field-definitions | DONE |
| Relaciones | /relations | /relations, /relations/options | DONE |
| Automatizaciones | /settings/automations | /automations | PARTIAL |
| Archivos | /files | /files, /files/{id}/download | PARTIAL |
| Datos | /settings/data | /imports, /exports | PARTIAL |
| Auditoría | /settings/audit | /audit-logs | DONE |
| Equipo | /settings/team | /users, /users/invitations, /roles | DONE |
| Integraciones | /settings/integrations | /integrations, /integrations/providers, /webhooks/endpoints | PARTIAL |
| Perfil y seguridad | /profile | /auth/me, /auth/password | PARTIAL |

## Componentes de producto reutilizables

- DataTable: sorting, selección, visibilidad de columnas, export hook, loading y empty.
- ListToolbar: búsqueda, acciones y filtros básicos.
- DynamicForm/CustomFieldRenderer: formularios derivados de definiciones del API.
- ActivityTimeline: presentación de eventos y estados de loading/empty.
- RecordForm: formularios core para contactos, organizaciones, leads, deals y tareas.
- Can: autorización visual basada en permisos efectivos.
- AsyncState, ErrorState, ConfirmDialog y FileDropzone: estados y acciones comunes.
- AppShell, Sidebar, Header, GlobalSearch y NotificationCenter: experiencia transversal.

## Convenciones

- Todos los recursos internos se navegan con IDs numéricos.
- El cliente HTTP pasa por src/lib/api/client.ts y el proxy /api/backend/[...path].
- Las mutaciones invalidan namespaces de TanStack Query; no se duplica server state en Zustand.
- Las respuestas 401 disparan crm:unauthorized y limpian sesión/cache.
- Las operaciones no disponibles en Laravel se registran como BLOCKED_BY_API, no como mock.
