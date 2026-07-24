---
name: anklo-dispatch-readiness
description: Verifica que un paquete de trabajo de ANKLO-OS pueda despacharse con base, permisos, herramientas, worktree y controles correctos, sin iniciar la ejecución.
---

# Objetivo

Determinar si un ejecutor puede recibir un paquete de trabajo sin ampliar autoridad, mezclar funciones ni poner en riesgo el repositorio.

# Cuándo usar

- Después de generar `anklo-work-package`.
- Inmediatamente antes de autorizar el despacho.
- Cuando cambian herramienta, permisos, rama, worktree, lease, base SHA o kill switch.

# Cuándo no usar

- Para ejecutar el paquete.
- Para crear rama, worktree o configuración.
- Para aprobar el despacho en nombre de Israel.
- Cuando el paquete o el plan no están aprobados.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/SECURITY_BOUNDARIES.md`.
4. Issue, plan y paquete de trabajo vigentes.
5. Evidencia de aprobación humana.
6. Estado Git actual.
7. Configuración y permisos efectivos del ejecutor.
8. Registro de lease, kill switch o exclusividad cuando aplique.

# Entradas

- Paquete de trabajo.
- Ejecutor y versión.
- Base SHA, rama y worktree.
- Permisos efectivos.
- Allowlist.
- Lease o prueba de exclusividad.
- Kill switch.
- Estado de herramientas, servicios locales y red.
- Evidencia de que no hay otro agente sobre el mismo alcance.

# Precondiciones

- El paquete está completo y vigente.
- La herramienta puede inspeccionarse sin modificar.
- La rama y el worktree existen o su creación está separadamente autorizada.
- Los permisos pueden verificarse efectivamente.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Verificar issue, plan, paquete y aprobaciones.
2. Verificar base SHA, rama, worktree, HEAD y limpieza.
3. Verificar ausencia de colisiones o trabajo concurrente no coordinado.
4. Verificar lease, responsable y duración cuando aplique.
5. Comparar permisos efectivos contra mínimo privilegio.
6. Verificar herramientas, versiones y servicios necesarios.
7. Confirmar que plugins, MCP, red, escritura y comandos no autorizados estén denegados.
8. Verificar allowlist y fuera de alcance.
9. Verificar pruebas, evidencia, handoff y kill switch.
10. Simular conceptualmente las condiciones de parada.
11. Recomendar despacho o bloqueo; no ejecutar.

# Condiciones de parada

- Base SHA, HEAD, rama o worktree no coinciden.
- El árbol no está limpio antes de iniciar.
- Existe colisión de worktree, rama, lease o alcance.
- Los permisos efectivos exceden el paquete.
- El ejecutor puede acceder a secretos, producción o red no necesaria.
- Hay plugins, MCP o dependencias no autorizadas.
- Falta kill switch, evidencia o handoff.
- La autorización de despacho no es explícita.
- El paquete cambió durante la verificación.

# Verificaciones

- Issue, plan, paquete y autorización están vinculados.
- Base, rama, worktree y estado Git son actuales.
- No existe ejecución concurrente no autorizada.
- Permisos y herramientas cumplen mínimo privilegio.
- Allowlist y condiciones de parada son aplicables.
- Kill switch y handoff son utilizables.
- La recomendación no se presenta como autorización.

# Formato de salida humano

Presentar:

1. Resultado de preparación para despacho.
2. Identidad del paquete y ejecutor.
3. Base, rama, worktree y estado Git.
4. Lease y ausencia de colisiones.
5. Matriz de permisos y herramientas.
6. Allowlist, fuera de alcance y kill switch.
7. Bloqueos o desviaciones.
8. Frase exacta de autorización humana requerida.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-dispatch-readiness",
  "result": "READY",
  "blockers": [],
  "authorized_files": [],
  "evidence": [
    {
      "type": "file",
      "source": "ruta o identificador verificable",
      "observation": "hecho observado",
      "status": "VERIFIED"
    }
  ],
  "data": {
    "dispatch_status": "READY_TO_DISPATCH",
    "lease_status": "estado de lease verificable",
    "collisions": [],
    "kill_switch": false
  },
  "recommended_next_state": "HUMAN_DISPATCH_APPROVAL_REQUIRED"
}
```

Reglas del objeto:

- `schema_version` debe ser `"1.0"`.
- `skill` debe coincidir con el nombre de esta Skill y su directorio.
- `result` solo puede ser `READY`, `NOT_READY`, `BLOCKED_BY_DECISION`, `BLOCKED_BY_SECURITY`, `FAILED_VERIFICATION` o `COMPLETED`.
- `blockers` debe enumerar impedimentos concretos y coincidir con la salida humana.
- `authorized_files` solo puede reproducir una autorización expresa y verificable; una lista vacía no autoriza edición.
- `evidence` registra observaciones y el resultado de su verificación. Las inferencias no se registran como evidencia.
- Cada evidencia debe usar `type` igual a `git`, `file`, `issue`, `pr`, `command` o `tool`, y `status` igual a `VERIFIED` o `NOT_VERIFIED`. Solo `VERIFIED` puede sustentar conclusiones. Todo elemento `NOT_VERIFIED` debe reflejarse también en `blockers` y no puede sustentar resultados positivos, de disponibilidad, aprobación o completitud.
- `data` contiene los estados y datos operativos específicos de esta Skill; no sustituye `result`, no amplía `authorized_files` y no autoriza acciones.
- `data` debe contener como mínimo `dispatch_status`, `lease_status`, `collisions` y `kill_switch`.
- `dispatch_status` solo puede ser `READY_TO_DISPATCH`, `NOT_READY` o `BLOCKED`.
- `recommended_next_state` recomienda el siguiente estado, pero no ejecuta ni autoriza la acción.
- `READY` y `COMPLETED` no autorizan escritura, commit, push, merge ni deploy.

## Acciones prohibidas

- Editar, crear, mover o borrar archivos.
- Crear o modificar ramas, worktrees, commits, tags o referencias.
- Ejecutar push, force push, merge, rebase, reset destructivo, clean o deploy.
- Abrir, cerrar, fusionar o modificar issues o PR sin mandato específico.
- Instalar dependencias, plugins, MCP, Skills externas o herramientas.
- Acceder a producción, secretos, tokens, contraseñas o credenciales.
- Ampliar el alcance o `authorized_files` por inferencia.
- Convertir una propuesta, borrador, transcripción o salida de IA en requisito aprobado.
- Declarar una prueba como aprobada cuando no fue ejecutada.
- Ocultar una desviación, limpiar evidencia o continuar después de una condición de parada.
