# Backlog Sprint 0

| ID    | Objetivo             | Entregable                    | Criterio de aceptación                         | Estado |
| ----- | -------------------- | ----------------------------- | ---------------------------------------------- | ------ |
| S0-01 | Gobierno             | `AGENTS.md`                   | Máximo 200 líneas e invariantes explícitas     | Hecho  |
| S0-02 | Decisión base        | ADR 0001                      | Registra stack, alternativas y riesgos         | Hecho  |
| S0-03 | Modularidad          | Límites modulares             | Todos los módulos solicitados tienen fronteras | Hecho  |
| S0-04 | Incertidumbre        | Preguntas abiertas            | Clasificación sin respuestas inferidas         | Hecho  |
| S0-05 | Monorepo             | pnpm workspaces               | Instalación reproducible con lockfile          | Hecho  |
| S0-06 | Calidad estática     | TypeScript, ESLint y Prettier | Comandos raíz correctos                        | Hecho  |
| S0-07 | Web mínima           | Next.js App Router            | Build correcto y página no operativa           | Hecho  |
| S0-08 | Contrato             | Esquema Zod de salud          | Esquema estricto y tipo inferido               | Hecho  |
| S0-09 | Endpoint             | `GET /api/health`             | HTTP 200, sin secretos ni datos de negocio     | Hecho  |
| S0-10 | Prueba               | Prueba de salud               | Valida estado, timestamp y campos              | Hecho  |
| S0-11 | Persistencia base    | Prisma mínimo                 | `prisma validate` correcto, sin modelos        | Hecho  |
| S0-12 | Desarrollo local     | Compose PostgreSQL            | `docker compose config` correcto               | Hecho  |
| S0-13 | Integración continua | GitHub Actions                | Instala, audita y ejecuta `verify`             | Hecho  |
