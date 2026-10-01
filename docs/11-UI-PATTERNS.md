# Vantex CRM — Patrones UI

## Design system

La interfaz usa Tailwind CSS y componentes propios compatibles con shadcn/ui:

- Button, Input, Select, Textarea, Label, Card, Dialog, Badge y Skeleton.
- Tokens de marca brand, brand-strong, brand-soft, surface, surface-subtle, muted, danger y success.
- Bordes suaves, densidad compacta, tipografía de sistema y radios consistentes.
- Iconos Lucide; no se agregan librerías visuales alternativas.

## Estructura de pantalla

1. AppShell resuelve sesión y renderiza navegación.
2. PageHeader comunica módulo, título, descripción y acción principal.
3. ListToolbar contiene búsqueda y filtros.
4. DataTable o cards muestran resultados con loading/empty/error.
5. Pagination conserva la paginación del API.
6. Dialog se reserva para acciones acotadas; los detalles usan rutas propias.

## Estados obligatorios

- loading: ListSkeleton o skeleton contextual sin saltos de layout.
- empty: explicación breve y CTA principal.
- error: ErrorState con retry; nunca stack traces.
- forbidden: ocultar acción con Can y no revelar datos.
- mutation pending: deshabilitar controles y cambiar el label a una acción progresiva.
- 422: mapear ApiError.fieldErrors a los campos mediante applyServerErrors.
- 401: limpiar cache/sesión y redirigir al login.

## Permisos

Can solo mejora la UX. El API sigue siendo la autoridad. Cada CTA de crear/editar/eliminar debe envolver el permiso correspondiente y las mutaciones deben mostrar el error del backend.

## Formularios

- React Hook Form + Zod para campos core.
- DynamicForm para definiciones entregadas por API.
- No duplicar reglas de dominio en componentes.
- Mantener datos introducidos cuando una operación transient/offline pueda reintentarse.
- Los secretos se muestran una única vez cuando el contrato lo indique.

## Tablas

Usar DataTable para listas con:

- encabezados semánticos y botones de sorting;
- selección solo cuando exista una acción masiva real;
- visibilidad de columnas controlada por estado de pantalla;
- filas navegables con links accesibles;
- paginación del servidor;
- confirmación antes de eliminar.

## Customer 360 y timeline

El detalle de un registro debe priorizar contexto:

- encabezado con identidad, owner, score/estado y acciones rápidas;
- propiedades y campos personalizados;
- relaciones y registros asociados;
- timeline con filtros y composer;
- tareas y archivos;
- deep links a registros con IDs autorizados.

Los filtros de timeline se aplican sobre tipos de actividad reales (email, whatsapp, call, meeting, task, note, quote, deal, ticket, system). Si el API aún no entrega un tipo, el frontend no lo inventa como actividad persistida.

## Responsive y accesibilidad

- Operaciones desktop pueden usar dos o tres columnas; en móvil se apilan.
- Tablas conservan scroll horizontal controlado.
- Todos los inputs tienen Label/aria-label.
- Dialogs soportan Escape y cierre explícito.
- Acciones principales son alcanzables con teclado y tienen estados focus visibles.
- Drag & drop debe tener alternativa por acción o selección cuando se implemente.

## Búsqueda y navegación

La búsqueda global muestra resultados agrupados y enlaces profundos. La command palette usa Ctrl+K/Cmd+K, respeta permisos y permite navegar o abrir acciones existentes. Ninguna de las dos debe crear contratos paralelos ni guardar tokens en el cliente.
