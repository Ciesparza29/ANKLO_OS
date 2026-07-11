# ADR 0001: arquitectura base

- **Estado:** Aceptada para Sprint 0
- **Fecha:** 10 de julio de 2026

## Contexto

ANKLO-OS necesita una base reproducible para entregas verticales pequeñas, sin implementar aún módulos operativos ni convertir asuntos pendientes en requisitos.

## Decisión

Se adopta un monolito modular con TypeScript de extremo a extremo, Next.js App Router, PostgreSQL, Prisma, Zod, pnpm workspaces, Docker para PostgreSQL local y GitHub Actions. Los datos estructurados se separan de archivos binarios. El esquema se prepara conceptualmente para multiempresa mediante `organization_id`, autorización en servicio y RLS adicional cuando sea viable.

## Alternativas consideradas

- Microservicios: rechazados por complejidad prematura.
- Turborepo: diferido; no aporta una ventaja necesaria en Sprint 0.
- Redis/BullMQ, worker, S3 y offline: reservados para fases posteriores.
- ORM alternativo o SQL directo generalizado: diferidos hasta existir necesidades medibles.

## Consecuencias

La instalación y verificación quedan centralizadas; los paquetes delimitan capas sin despliegues independientes. Prisma no contiene todavía modelos ni migraciones de negocio.

## Riesgos

Los límites pueden degradarse si se importan internals entre módulos. La preparación multiempresa no prueba aislamiento hasta existir modelo, autorización y pruebas específicas.

## Asuntos pendientes

Identidad, infraestructura, políticas documentales, conectividad y objetivos de continuidad permanecen en `docs/decisions/open-questions.md`.

## Fuentes

- `Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md`
- `Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md`
- `Resumen_Maestro_Proyecto_ANKLO_v1.1.md`
- `README.md`
- `Glosario_Maestro_ANKLO_v1.1-borrador.md` (terminología no aprobada)
