# ANKLO Agent Orchestrator

CLI local y deny-by-default para despachar trabajo aprobado hacia agentes sin
conceder capacidad de merge, despliegue, shell arbitrario ni acceso a producción.

## Estado del incremento

El primer incremento incluye:

- CLI local sin listeners de red;
- configuración estricta con runtime fuera del repositorio;
- `dry-run` obligatorio por defecto;
- comandos read-only `diagnose` y `plan`;
- salida humana y JSON versionada;
- política explícita de capacidades permitidas y denegadas.

El runtime mutable se ubicará en `~/.anklo-orchestrator/`. No se almacenan bases,
leases, paquetes generados ni logs dentro del repositorio o de un worktree.

## Uso inicial

```bash
pnpm orchestrator diagnose --format json
pnpm orchestrator plan --issue 24 --format json
```

No existen comandos de merge, despliegue, push, creación de PR ni shell arbitrario.
