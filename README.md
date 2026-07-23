# ANKLO-OS — desarrollo

Base temprana del ERP ANKLO-OS con un primer incremento funcional integrado en `main` de solicitudes manuales de corte: creación, listado, detalle, envío, cancelación e historial de solicitudes de corte. La documentación funcional permanece en `ANKLO_Paquete_Documental_v1.0/` y no es sustituida por este README.

## Requisitos

- Node.js 24 o posterior.
- pnpm 11.7.0, fijado mediante `packageManager` y lockfile.
- Docker con Compose.

## Instalación

```bash
pnpm install --frozen-lockfile
```

`.env.example` contiene únicamente identidades, organización, capacidades,
credenciales y demás valores ficticios de desarrollo local. Producción falla
cerrada mientras no exista una integración de identidad real. No guardar
secretos reales. Para iniciar PostgreSQL y la aplicación, carga sus variables
en la misma sesión de shell que ejecutará Next.js:

```bash
docker compose up -d postgres
set -a
source .env.example
set +a
pnpm --filter @anklo/web dev
```

`.env.example` carga una organización ficticia de desarrollo. Para usar una organización QA distinta, ejecuta lo siguiente después de cargar el archivo y antes de iniciar Next.js:

```bash
export ANKLO_DEV_ORGANIZATION_ID=<UUID_QA>
```

La aplicación queda disponible en `http://localhost:3000` y la salud técnica en `/api/health`.

## Comandos

- `pnpm format` / `pnpm format:check`: formato.
- `pnpm lint`: reglas de código y fronteras de importación.
- `pnpm arch:check`: dirección de paquetes y ciclos.
- `pnpm deps:check`: dependencias peer.
- `pnpm typecheck`, `pnpm test`, `pnpm db:validate`, `pnpm build`.
- `pnpm verify`: aceptación completa de la fundación.

## Estructura

```text
apps/web/            aplicación y raíz de composición
packages/contracts/ contratos Zod y tipos
packages/domain/    reglas y puertos sin frameworks
packages/db/        adaptador Prisma
packages/ui/        componentes compartidos
packages/config/    configuración fundacional
docs/                ADR, arquitectura, decisiones y backlog
```

La dirección permitida se define en `AGENTS.md` y se comprueba automáticamente.
Prisma contiene el modelo funcional inicial de solicitudes de corte y su
auditoría. La unidad `MM` configurada para desarrollo es temporal y no constituye
un catálogo productivo ni una definición aprobada de precisión, conversión o
redondeo.

## Flujo de ramas

Crear una rama corta desde la rama predeterminada, realizar un único cambio revisable, ejecutar `pnpm verify` y abrir un pull request. No confirmar secretos, artefactos generados ni cambios documentales ajenos.

## Fuentes canónicas

- `ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/README.md`
- `ANKLO_Paquete_Documental_v1.0/Glosario_Maestro_ANKLO_v1.1-borrador.md`, solo como terminología auxiliar no aprobada.
- `docs/ai/README.md`, guía de contexto para agentes (no sustituye fuentes funcionales).
