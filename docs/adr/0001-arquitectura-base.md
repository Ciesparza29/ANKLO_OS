# ADR 0001: arquitectura base

- **Estado:** Aceptada provisionalmente para la fundación; sujeta a ADR posteriores por corte vertical
- **Fecha:** 10 de julio de 2026

## Contexto

ANKLO-OS necesita una base reproducible para entregas verticales pequeñas, sin implementar módulos operativos ni convertir asuntos pendientes en requisitos.

## Decisión

Se adopta un monolito modular con TypeScript, Next.js App Router, PostgreSQL, Prisma, Zod, pnpm workspaces, Docker para PostgreSQL local y GitHub Actions. Las capas son:

1. `contracts`: esquemas y tipos sin dependencias de framework o persistencia.
2. `domain`: reglas y puertos; depende únicamente de contratos.
3. `db`: adaptador Prisma que implementará puertos del dominio.
4. `ui`: componentes compartidos sin persistencia.
5. `apps/web`: raíz de composición y entrega HTTP.

`apps/web` compone implementaciones de `db` con puertos de `domain`; el dominio nunca conoce Prisma, Next.js, UI ni adaptadores. Prisma todavía no contiene modelos funcionales ni migraciones de negocio.

Los datos estructurados se separan de archivos binarios. El esquema futuro se prepara conceptualmente para multiempresa mediante `organization_id`, autorización en servicio y RLS adicional cuando sea viable.

## Alternativas consideradas

- Microservicios: rechazados por complejidad prematura.
- Dominio dependiente de Prisma: rechazado por acoplar reglas a infraestructura.
- Turborepo: diferido; no aporta una ventaja necesaria en la fundación.
- Redis/BullMQ, worker, S3 y offline: reservados para fases posteriores.

## Consecuencias

La aplicación controla la composición; los adaptadores dependen hacia los puertos y no al revés. Las fronteras se verifican con ESLint y `pnpm arch:check`. Los paquetes son límites lógicos, no despliegues independientes.

## Riesgos

Las reglas automáticas cubren paquetes e importaciones declaradas, pero no sustituyen revisión de diseño. La preparación multiempresa no prueba aislamiento hasta existir modelo, autorización y pruebas específicas.

## Asuntos pendientes

Identidad, infraestructura, políticas documentales, conectividad y continuidad permanecen en `docs/decisions/open-questions.md`.

## Fuentes

- `ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/README.md`
- `ANKLO_Paquete_Documental_v1.0/Glosario_Maestro_ANKLO_v1.1-borrador.md` (terminología no aprobada)
