# ANKLO Agent Orchestrator

CLI local y deny-by-default para despachar trabajo aprobado hacia agentes sin
conceder capacidad de merge, despliegue, shell arbitrario ni acceso a producción.

## Capacidades implementadas hasta la remediación 16.5-R1

- CLI local sin listeners de red;
- configuración estricta con runtime fuera del repositorio;
- `dry-run` obligatorio por defecto;
- salida humana y JSON versionada;
- contratos estrictos para `PLAN_APPROVED`, `IMPLEMENT_APPROVED`,
  `PUSH_APPROVED` y `MERGE_APPROVED`;
- timestamps UTC semánticamente válidos y canónicos;
- enlace atómico de cada aprobación con el run y sus datos protegidos;
- persistencia del cuerpo, sobre observado, nonce y consumo de aprobación;
- máquina de estados declarativa y replanificación obligatoria tras cambios;
- SQLite versionado con `WAL`, claves foráneas, `busy_timeout`,
  `user_version` e `integrity_check` verificados;
- idempotencia de runs;
- binding inmutable del target de implementación;
- leases transaccionales exclusivos por issue y worktree;
- heartbeat, liberación y recuperación de leases vencidos o con proceso muerto;
- auditoría append-only;
- protección contra replay de event ID, nonce y comentario;
- kill switch persistente global y por run;
- cuarentena persistente con preservación de evidencia;
- bloqueo de estados que todavía dependen de adaptadores GitHub/CI no
  implementados;
- work packages con esquema exacto, canonicalización JSON estricta, bindings
  completos, hash SHA-256 y persistencia inmutable fuera del worktree;
- validación y creación controlada de worktrees registrados, con repositorio,
  rama, limpieza y SHA base exactos;
- perfiles de verificación cerrados `docs-only` y `code-standard`, resueltos
  únicamente contra herramientas instaladas en el repositorio;
- adaptador GitHub concreto y exclusivamente de lectura para `gh issue view`,
  `gh pr view` y endpoints GET allowlisted;
- adaptador Codex no interactivo para `codex-cli 0.144.6`, con sandbox
  `read-only`, sesión efímera, configuración aislada, MCP vacío y salida JSONL
  validada mediante schema;
- integración de package, worktree, runner y adaptadores con estados,
  aprobaciones, leases y auditoría del `StateStore`;
- análisis AST de todas las invocaciones permitidas de `node:child_process`.

## Issue #27 — Pilot Supervisado (supervised-pilot-v7)

Añade el comando `pilot:preflight` y endurece `run:bind-target`:

- `pilot:preflight` — diagnóstico de solo lectura que verifica: identidad de
  repositorio, issue #27 abierto, SHA base exacto, rama `main`, limpieza de
  árbol y área de preparación, kill switch inactivo, capacidades denegadas y
  `READY_TO_DISPATCH` ausente o no rastreado. Calcula el SHA-256 del cuerpo
  del issue sin normalizar los bytes. Rechaza `--apply`. No crea directorios,
  SQLite, ramas, worktrees, archivos, leases, aprobaciones ni eventos de
  auditoría.
- `run:bind-target --apply` — rechazado antes de abrir o mutar el `StateStore`.
  El modo dry-run permanece diagnóstico y ejecuta cero efectos.

El runtime mutable se ubica en `~/.anklo-orchestrator/`. Cualquier override de
SQLite debe permanecer dentro de ese runtime, fuera del repositorio y sin
atravesar enlaces simbólicos.

## Uso

```bash
pnpm orchestrator diagnose --format json
pnpm orchestrator plan --issue 24 --format json
pnpm orchestrator state:init --apply --format json
pnpm orchestrator pilot:preflight --format json \
  --issue-body "$(cat ISSUE_27_BODY)" \
  --current-branch main \
  --head-sha 633c98c6effd7523a623c6e3a180e9dc06b877cf \
  --worktree-clean --index-clean
```

Los comandos con efectos permanecen en `dry-run` salvo que reciban `--apply`.
La transición a estados protegidos exige la aprobación estructurada vigente y
vinculada al run exacto. Antes de despacho también debe existir un target de
implementación inmutable.

No existen comandos de merge, despliegue, push, creación de PR ni shell
arbitrario.

## Límites de ejecución de la subfase 16.5

- `full-verify` no es un perfil disponible.
- El runner no acepta perfiles, ejecutables, argumentos, cwd ni entorno
  suministrados por el work package.
- `docs-only` usa el Prettier ya instalado.
- `code-standard` ejecuta, en orden, formato, ESLint, arquitectura, TypeScript
  y Vitest mediante scripts pre-resueltos dentro del worktree.
- El adaptador GitHub no expone comentarios, edición, cierre, creación de PR,
  merge ni métodos HTTP distintos de GET.
- Codex usa `--ignore-user-config`, `mcp_servers={}`, `--sandbox read-only`,
  `--ephemeral`, `--json`, `--output-schema` y `--cd`.
- Los outputs de procesos se limitan durante la ejecución y se sanitizan antes
  de ser retornados o auditados.
- La evidencia externa se conserva bajo
  `~/.anklo-orchestrator/reviews/issue-24/subphase-16.5-remediation-r1/`.
