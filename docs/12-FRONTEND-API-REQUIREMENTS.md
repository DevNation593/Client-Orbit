# Vantex CRM — Requisitos API para frontend

Actualizado: 2026-10-09, contra la rama `dev` de API Orbit (API-1 a API-7.2).

Este documento registra dependencias que no están disponibles en API Orbit. Son propuestas de contrato, no endpoints implementados por el frontend. Todos los recursos internos deben usar IDs numéricos; los enlaces públicos usan el UUID `public_id` o tokens opacos, nunca un slug como identificador del sistema.

## Propuestas anteriores ya resueltas

La versión del 2026-09-01 pedía los contratos siguientes. El API los entregó, en varios casos con una ruta distinta a la propuesta. El frontend debe usar la ruta real.

| Propuesta original | Ruta real en el API |
|---|---|
| `GET /activities?activityable_type=…` para el timeline | `GET /contacts/{id}/timeline` |
| Datos agregados para Customer 360 | `GET /contacts/{id}/overview` |
| `GET /search` | `GET /search` |
| `/views` | `/saved-views` |
| `/conversations` y mensajes | `/conversations`, `/conversations/{id}/messages`, `/inboxes`, `/canned-responses` |
| `POST /conversations/{id}/assign` | `PATCH /conversations/{id}/assign`, `PATCH …/status`, `PATCH …/read` |
| `/notifications` y lectura | `/notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `/notification-preferences` |
| `/forms`, campos y envíos | `/forms`, `/forms/{id}/submissions` |
| `/sequences` | `/sequences`, `/sequence-enrollments` |
| `/meeting-types` y disponibilidad | `/meeting-types`, `/meeting-bookings`; disponibilidad pública en `/public/meetings/{publicId}/availability` |
| `/products`, `/price-lists`, `/quotes` | Igual, más `/cpq`, `/bundles`, `/taxes`, `/discounts`, `/currencies` |
| `POST /quotes/{id}/send`, `approve`, `accept`, `GET …/pdf` | Igual, más `submit`, `revise`, `duplicate`, `cancel`, `reject` y `sync-erp` |
| `/forecast`, `/goals`, `/analytics/sales` | `/forecast`, `/goals`, `/sales-analytics` |
| `/tickets` y `GET /tickets/{id}/sla` | Igual, más `/support/*` para agentes, colas, categorías y políticas SLA |
| `/knowledge/articles` | Igual, más categorías, etiquetas, versiones y publicación |
| `POST /data-quality/merge` | `POST /contacts/{id}/merge` y `POST /companies/{id}/merge`, con `duplicate-check` previo |

## Contratos que siguen faltando

### Búsqueda global: tareas

Estado actual: `GET /search` cubre contactos, empresas, leads, oportunidades, documentos y registros personalizados, pero no tareas. El frontend las consulta aparte con `GET /tasks?search=`.

Propuesta: aceptar `tasks` en `types[]` y devolverlas con el mismo formato y ranking.

### Etiquetas: quitar una asignación por registro

Estado actual: `DELETE /tags/{tag}/assignments/{assignment}` exige el id de la asignación, y `GET /tags?entity_type=…&entity_id=…` devuelve las etiquetas del registro sin ese id. El frontend lo obtiene repitiendo el `POST` de asignación, que es idempotente.

Propuesta, cualquiera de las dos:

~~~
DELETE /api/v1/tags/{tag}/assignments?entity_type=contact&entity_id=123
~~~

o incluir `assignment_id` en cada etiqueta cuando el listado se filtra por registro.

### Importaciones y exportaciones: historial

Estado actual: solo existen `POST` y `GET /{id}`. No hay listado, así que un lote solo se puede seguir desde la pantalla que lo creó.

~~~
GET /api/v1/imports
GET /api/v1/exports
~~~

Además, `download_url` de una exportación solo se genera cuando el disco es S3; con almacenamiento local no hay forma de descargar el archivo.

### Archivos por registro

Estado actual: `GET /files` no filtra por registro relacionado.

~~~
GET /api/v1/files?related_type=contact&related_id=123
~~~

Motivo: listar documentos desde fichas distintas del contacto (el overview del contacto ya incluye sus documentos).

### Automatizaciones: historial de ejecuciones

Estado actual: `/automations` expone solo el CRUD.

~~~
GET  /api/v1/automations/{id}/runs
GET  /api/v1/automations/{id}/runs/{runId}
POST /api/v1/automations/{id}/runs/{runId}/retry
~~~

Motivo: mostrar resultado, error y reintentos de cada ejecución.

### Webhooks: entregas y secreto

Estado actual: `/webhooks/endpoints` expone solo el CRUD.

~~~
GET  /api/v1/webhooks/endpoints/{id}/deliveries
POST /api/v1/webhooks/endpoints/{id}/rotate-secret
~~~

Los secretos nunca deben regresar en list/show.

### Integraciones: OAuth y estado de sincronización

~~~
GET /api/v1/integrations/{id}/auth-url
GET /api/v1/integrations/{id}/sync-status
~~~

OAuth debe completar el flujo en backend y devolver solo estado y metadata segura.

### Módulos habilitados, flags y límites de plan

~~~
GET /api/v1/tenant/features
~~~

Respuesta esperada: módulos habilitados para el tenant, flags (`crm.whatsapp.enabled`, `crm.service.enabled`…) y uso frente a límite del plan. Motivo: condicionar la navegación sin hardcodear planes en componentes.

### Panel de servicio

~~~
GET /api/v1/support/metrics
~~~

Tickets abiertos, urgentes, en riesgo de SLA, incumplidos, y tiempos medios de respuesta y resolución, con filtros por cola y periodo.

### Data Quality Center

~~~
GET /api/v1/data-quality
~~~

Conteos agregados: duplicados probables, emails y teléfonos inválidos, registros incompletos, sin propietario y oportunidades estancadas. La fusión ya existe.

### ERP: datos del cliente

~~~
GET  /api/v1/erp/customer-summary/{contactId}
POST /api/v1/deals/{id}/sales-order
~~~

Hoy solo se expone el estado de sincronización (`/erp/syncs`).

### Acciones masivas

Asignar propietario, etiquetar, actualizar un campo, añadir a secuencia y eliminar sobre una selección de registros. Requiere confirmación en las destructivas y respuesta con resultado por registro.

### Fases de backend pendientes

Sin contrato todavía; dependen de fases completas del API:

- Portal de clientes (API-7.3, en desarrollo), Customer Success y encuestas NPS/CSAT.
- Dashboards y reportes guardados.
- API keys y apps de desarrollador (API-9).
- Layouts, reglas de validación, campos fórmula y plantillas por industria (API-8).
- Plantillas de documentos.
- Vantex AI (API-10).

Cada contrato debe especificar paginación, permisos, límites, filtros, auditoría, errores 422 y aislamiento tenant antes de crear la pantalla.
