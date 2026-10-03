# Vantex CRM Frontend

Frontend independiente para el CRM SaaS multiindustria. Está construido con Next.js App Router, React, TypeScript estricto, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Axios-compatible HTTP abstractions, Vitest, React Testing Library y Playwright.

## Desarrollo

1. Copia `.env.example` a `.env.local`.
2. Instala dependencias con `npm install`.
3. Arranca `npm run dev`.

`API_URL` apunta al backend Laravel. Las llamadas del navegador pasan por `/api/backend/[...path]`, que añade el token Sanctum desde una cookie HttpOnly y el tenant activo como `X-Tenant-ID`. El token no se guarda en `localStorage`.

Las entidades personalizadas y sus registros se navegan y consultan mediante IDs numéricos: `/entities/[entityId]` y `/entities/[entityId]/[recordId]`. No se expone ningún identificador textual alternativo.

## Arquitectura

- `src/app`: rutas App Router, layouts y route handlers de sesión/proxy.
- `src/components`: design system, navegación, tablas y formularios reutilizables.
- `src/features`: piezas de dominio; las definiciones de entidad y campo no están hardcodeadas por industria.
- `src/hooks`: consultas/mutaciones TanStack Query con invalidación consistente.
- `src/lib/api`: cliente centralizado, errores y recursos REST alineados con `backend/docs/openapi.yaml`.
- `src/types`: contratos TypeScript del API.

## Verificaciones

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Las acciones críticas de seguridad y reglas de negocio permanecen en Laravel; el frontend solo controla presentación, configuración de formularios y definiciones declarativas de automatizaciones.
