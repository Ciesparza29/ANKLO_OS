# ANKLO Agent Orchestrator

CLI local y deny-by-default para despachar trabajo aprobado hacia agentes sin
conceder capacidad de merge, despliegue, shell arbitrario ni acceso a producción.

## Capacidades implementadas hasta la remediación de la subfase 16.4

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
  implementados.

El runtime mutable se ubica en `~/.anklo-orchestrator/`. Cualquier override de
SQLite debe permanecer dentro de ese runtime, fuera del repositorio y sin
atravesar enlaces simbólicos.

## Uso

```bash
pnpm orchestrator diagnose --format json
pnpm orchestrator plan --issue 24 --format json
pnpm orchestrator state:init --apply --format json
```

Los comandos con efectos permanecen en `dry-run` salvo que reciban `--apply`.
La transición a estados protegidos exige la aprobación estructurada vigente y
vinculada al run exacto. Antes de despacho también debe existir un target de
implementación inmutable.

No existen comandos de merge, despliegue, push, creación de PR ni shell
arbitrario.
