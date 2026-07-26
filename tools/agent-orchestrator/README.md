# ANKLO Agent Orchestrator

CLI local y deny-by-default para despachar trabajo aprobado hacia agentes sin
conceder capacidad de merge, despliegue, shell arbitrario ni acceso a producción.

## Capacidades implementadas hasta la subfase 16.4

- CLI local sin listeners de red;
- configuración estricta con runtime fuera del repositorio;
- `dry-run` obligatorio por defecto;
- salida humana y JSON versionada;
- contratos estrictos para `PLAN_APPROVED`, `IMPLEMENT_APPROVED`,
  `PUSH_APPROVED` y `MERGE_APPROVED`;
- máquina de estados declarativa;
- SQLite con `WAL`, claves foráneas, `busy_timeout` e `integrity_check`;
- idempotencia de runs;
- leases transaccionales exclusivos por issue y worktree;
- auditoría append-only;
- protección contra replay de aprobaciones;
- kill switch mediante `ANKLO_ORCHESTRATOR_KILL_SWITCH=1`;
- bloqueo de estados que todavía dependen de adaptadores GitHub/CI no
  implementados.

El runtime mutable se ubica en `~/.anklo-orchestrator/`. No se almacenan bases,
leases, paquetes generados ni logs dentro del repositorio o de un worktree.

## Uso

```bash
pnpm orchestrator diagnose --format json
pnpm orchestrator plan --issue 24 --format json
pnpm orchestrator state:init --apply --format json
```

Los comandos con efectos permanecen en `dry-run` salvo que reciban `--apply`.
La transición a estados protegidos exige la aprobación estructurada correspondiente.
Los estados dependientes de GitHub, CI o merge permanecen bloqueados hasta que
sus adaptadores y guardas sean implementados y probados.

No existen comandos de merge, despliegue, push, creación de PR ni shell arbitrario.
