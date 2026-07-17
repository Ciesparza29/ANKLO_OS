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

## Incremento 1B — trazabilidad visible del detalle de solicitudes de corte

Estas tareas son exclusivamente de lectura y visualización. No incluyen nuevos
estados, comandos, migraciones, inventario, planificación, ejecución, costos,
Migo ni optimización.

| ID       | Objetivo      | Entregable                                  | Criterio de aceptación                                                                 | Estado    |
| -------- | ------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | --------- |
| CR-1B-01 | Contratos     | DTO y esquema estricto de historial         | Proyecta acción, fecha, `actorReference` y motivo permitido sin snapshots completos    | Pendiente |
| CR-1B-02 | Dominio       | Puerto de lectura de historial              | Requiere `cut_request:read` y `cut_request:read_history` sin añadir comandos           | Pendiente |
| CR-1B-03 | Persistencia  | Consulta tenant-aware de `AuditEvent`       | Filtra organización/solicitud, respeta RLS y devuelve orden estable sin migración      | Pendiente |
| CR-1B-04 | Autorización  | Casos de uso y denegaciones por capacidad   | Lectura básica no concede historial y la capacidad de historial no sustituye la básica | Pendiente |
| CR-1B-05 | API           | Recurso de lectura de historial             | Respuesta mínima; motivo solo autorizado; sin filtración entre organizaciones          | Pendiente |
| CR-1B-06 | Interfaz      | Historial accesible en el detalle           | Muestra referencia técnica secundaria y motivo permitido sin UUID completo principal   | Pendiente |
| CR-1B-07 | Pruebas       | Cobertura de `AC-CUT-1B-001`–`012`          | Valida contratos, capacidades, RLS, minimización, orden y ausencia de efectos          | Pendiente |
| CR-1B-08 | Documentación | Nota final y trazabilidad de implementación | Confirma alcance real, ausencia de migración y pendientes de identidad/datos maestros  | Pendiente |

### Trazabilidad de tareas a criterios

- `CR-1B-01`: `AC-CUT-1B-002`, `AC-CUT-1B-007`, `AC-CUT-1B-008`, `AC-CUT-1B-010`.
- `CR-1B-02`: `AC-CUT-1B-002`, `AC-CUT-1B-004`, `AC-CUT-1B-005`, `AC-CUT-1B-011`.
- `CR-1B-03`: `AC-CUT-1B-002`, `AC-CUT-1B-006`, `AC-CUT-1B-009`, `AC-CUT-1B-011`, `AC-CUT-1B-012`.
- `CR-1B-04`: `AC-CUT-1B-001`, `AC-CUT-1B-004`, `AC-CUT-1B-005`, `AC-CUT-1B-006`.
- `CR-1B-05`: `AC-CUT-1B-002`, `AC-CUT-1B-003`, `AC-CUT-1B-004`, `AC-CUT-1B-005`, `AC-CUT-1B-006`, `AC-CUT-1B-008`, `AC-CUT-1B-009`, `AC-CUT-1B-010`.
- `CR-1B-06`: `AC-CUT-1B-003`, `AC-CUT-1B-007`.
- `CR-1B-07`: `AC-CUT-1B-001`–`AC-CUT-1B-012`.
- `CR-1B-08`: `AC-CUT-1B-012` y trazabilidad documental completa.
