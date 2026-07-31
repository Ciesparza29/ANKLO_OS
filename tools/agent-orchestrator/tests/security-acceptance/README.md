# R1-003 a R1-006 — Harness de aceptación

Este directorio contiene los gates ejecutables para la remediación de seguridad
del orquestador local.

El harness se crea antes de modificar código productivo y debe fallar contra el
baseline del Commit 1. La implementación solo puede considerarse candidata a
revisión cuando todos estos tests pasan sin modificar ni debilitar el harness.

## Controles principales

- `node:child_process` únicamente en `trusted-process.ts`;
- Node anclado exclusivamente a `process.execPath`;
- ausencia de descubrimiento productivo mediante `PATH`, `HOME`, `PNPM_HOME`,
  `which`, `command -v`, `TEST_*` o `NODE_ENV`;
- ausencia de versiones desconocidas;
- ausencia de APIs exportadas que permitan `args`, `cwd`, `env`, ejecutable,
  ruta del worktree o trust manifest suministrados por callers;
- persistencia de trust manifest e identidad del repositorio;
- bloqueo de runs históricos sin trust manifest;
- identidad completa y revalidable del repositorio;
- veinte fixtures AST negativas separadas;
- `processExecuted=false` en cada violación;
- ausencia de bypasses que suministren un trust manifest nulo.

## Regla de integridad

No se permite modificar, eliminar, reducir ni marcar como `skip` estos tests
para conseguir un resultado verde. Las correcciones deben realizarse en el
código productivo y en pruebas adicionales, no debilitando este harness.

Las fixtures se almacenan como `.fixture.txt` porque representan código hostil de entrada para el analizador y no deben ser compiladas ni interpretadas por ESLint como código productivo.
