# Vantex CRM — Requisitos API para frontend

Este documento registra dependencias que no están disponibles en API Orbit. Son propuestas de contrato, no endpoints implementados por el frontend. Todos los recursos internos deben usar IDs numéricos; los enlaces públicos deben usar tokens opacos firmados o de un solo uso, nunca un slug como identificador del sistema.

## Customer 360 y timeline

### GET /api/v1/activities

Estado actual: existe, pero no permite filtrar por registro relacionado.

Propuesta aditiva:

~~~
GET /api/v1/activities?activityable_type=contact&activityable_id=123
GET /api/v1/activities?types=email,note&cursor=...
~~~

Respuesta esperada:

~~~json
{
  "data": [],
  "meta": {
    "next_cursor": null,
    "request_id": "req_..."
  }
}
~~~

Motivo: evitar descargar todo el tenant para construir un timeline y permitir infinite loading.

### GET /api/v1/relations

Estado actual: existe con filtros genéricos.

Propuesta de respuesta enriquecida opcional:

~~~json
{
  "data": [
    {
      "id": 1,
      "relation_type": "decision_maker",
      "from_type": "contact",
      "from_id": "123",
      "to_type": "deal",
      "to_id": "44",
      "from": { "type": "contact", "id": "123", "label": "Ana Pérez" },
      "to": { "type": "deal", "id": "44", "label": "Renovación" }
    }
  ]
}
~~~

Motivo: presentar relaciones en Customer 360 sin consultas adicionales ambiguas.

### GET /api/v1/files

Estado actual: existe, pero no documenta filtros por relación.

Propuesta:

~~~
GET /api/v1/files?related_type=contact&related_id=123
~~~

Motivo: mostrar documentos asociados de forma eficiente y tenant-safe.

## Búsqueda, vistas y tablas

### GET /api/v1/search

Request:

~~~
GET /api/v1/search?q=ana&types=contacts,organizations,deals,tasks&limit=8
~~~

Response:

~~~json
{
  "data": {
    "contacts": [],
    "organizations": [],
    "deals": [],
    "tasks": [],
    "custom_records": []
  },
  "meta": { "request_id": "req_..." }
}
~~~

Motivo: reemplazar búsquedas paralelas del navegador y soportar ranking/tenant/permissions en el backend.

### Saved views

Se requiere un recurso genérico:

~~~
GET    /api/v1/views?resource=contacts
POST   /api/v1/views
PATCH  /api/v1/views/{id}
DELETE /api/v1/views/{id}
~~~

Payload mínimo:

~~~json
{
  "resource": "contacts",
  "name": "Mis contactos",
  "filters": {},
  "columns": ["name", "email", "status"],
  "sort": [{ "field": "updated_at", "direction": "desc" }],
  "visibility": "private"
}
~~~

## Inbox y realtime

Recursos requeridos:

~~~
GET/POST        /api/v1/conversations
GET/POST        /api/v1/conversations/{id}/messages
PATCH           /api/v1/conversations/{id}
POST            /api/v1/conversations/{id}/assign
POST            /api/v1/conversations/{id}/notes
GET             /api/v1/conversations/{id}/events
GET             /api/v1/notifications
PATCH           /api/v1/notifications/{id}/read
POST            /api/v1/notifications/read-all
~~~

Eventos Reverb/Echo mínimos:

~~~
conversation.message.created
conversation.updated
conversation.assigned
notification.created
~~~

## Formularios, sequences y meetings

~~~
GET/POST/PATCH/DELETE /api/v1/forms
GET/POST               /api/v1/forms/{id}/fields
GET                    /api/v1/forms/{id}/submissions
GET/POST/PATCH/DELETE  /api/v1/sequences
GET/POST/PATCH/DELETE  /api/v1/meeting-types
GET                    /api/v1/meeting-types/{id}/availability
POST                   /api/v1/meeting-bookings
~~~

Los enlaces públicos deben recibir un token opaco con expiración y alcance limitado.

## Products, quotes y ERP

~~~
GET/POST/PATCH/DELETE  /api/v1/products
GET/POST/PATCH/DELETE  /api/v1/price-lists
GET/POST/PATCH/DELETE  /api/v1/quotes
POST                   /api/v1/quotes/{id}/send
POST                   /api/v1/quotes/{id}/approve
POST                   /api/v1/quotes/{id}/accept
GET                    /api/v1/quotes/{id}/pdf
GET                    /api/v1/erp/customer-summary/{contactId}
POST                   /api/v1/deals/{id}/sales-order
~~~

Requiere policies, auditoría, idempotencia y enlaces públicos sin IDs internos expuestos.

## Forecast, service, quality y builders

Contratos requeridos:

~~~
GET /api/v1/forecast
GET /api/v1/goals
GET /api/v1/analytics/sales
GET/POST/PATCH/DELETE /api/v1/tickets
GET /api/v1/tickets/{id}/sla
GET/POST/PATCH/DELETE /api/v1/knowledge/articles
GET /api/v1/data-quality
POST /api/v1/data-quality/merge
GET/POST/PATCH/DELETE /api/v1/dashboards
GET/POST/PATCH/DELETE /api/v1/reports
GET/POST/PATCH/DELETE /api/v1/api-keys
~~~

Cada contrato debe especificar paginación, permisos, límites, filtros, auditoría, errores 422 y aislamiento tenant antes de crear la pantalla.

## Integrations

El frontend actual consume el catálogo y operaciones básicas existentes. Para terminar conectores reales sin ocultar estados se necesitan:

~~~
GET  /api/v1/integrations/{id}/auth-url
GET  /api/v1/integrations/{id}/sync-status
GET  /api/v1/webhooks/endpoints/{id}/deliveries
POST /api/v1/webhooks/endpoints/{id}/rotate-secret
~~~

Los secretos nunca deben regresar en list/show. OAuth debe completar el flujo en backend y devolver solo estado/metadata segura.
