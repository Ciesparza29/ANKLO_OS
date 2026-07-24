---
name: anklo-handoff
description: Produce un handoff verificable de una fase o tarea de ANKLO-OS, reportando trabajo, evidencia, fallos, pendientes y autorización requerida sin ocultar desviaciones.
---

# Objetivo

Transferir contexto operativo suficiente para que el siguiente responsable continúe desde el estado real sin repetir trabajo ni asumir acciones inexistentes.

# Cuándo usar

- Al cerrar un paso, sesión, fase o intervención.
- Antes de cambiar de chat, herramienta, equipo o responsable.
- Cuando una tarea se detiene por bloqueo o desviación.
- Antes de una revisión independiente o remediación.

# Cuándo no usar

- Para declarar terminado algo que conserva pendientes.
- Para sustituir evidencia Git, CI, issue o PR.
- Para ocultar errores, cambios residuales o verificaciones no ejecutadas.
- Para autorizar el siguiente paso.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/HANDOFF_TEMPLATE.md`.
4. `docs/ai/DEFINITION_OF_DONE.md`.
5. Issue, plan, paquete y autorizaciones aplicables.
6. Estado Git final.
7. Comandos, herramientas, pruebas y resultados reales.
8. Evidencia de desviaciones y bloqueos.

# Entradas

- Fase, paso y objetivo.
- Repositorio y referencia estable.
- Base SHA, rama, HEAD, upstream y divergencia.
- Estado de archivos.
- Issue y PR.
- Alcance y fuera de alcance.
- Fuentes y decisiones.
- Trabajo, verificaciones, resultados, pendientes y riesgos.
- Siguiente responsable y autorización requerida.

# Precondiciones

- El estado final puede verificarse.
- Los resultados exactos están disponibles.
- Se distinguen acciones ejecutadas, no ejecutadas y fallidas.
- Las desviaciones están inventariadas y su evidencia preservada.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Registrar fase, paso, objetivo, repositorio y referencia estable.
2. Registrar base SHA, rama, HEAD, upstream y divergencia.
3. Registrar tracked modificados, staged y untracked.
4. Registrar issue, PR, alcance y fuera de alcance.
5. Enumerar fuentes consultadas y decisiones aprobadas.
6. Separar supuestos y decisiones pendientes.
7. Enumerar trabajo completado y archivos afectados.
8. Enumerar comandos o herramientas ejecutados y resultados exactos.
9. Registrar verificaciones ejecutadas, fallidas y no ejecutadas.
10. Adjuntar o referenciar evidencia.
11. Registrar pendientes, riesgos, prohibiciones y desviaciones.
12. Identificar siguiente responsable y acción exacta.
13. Indicar frase de autorización requerida, resultado esperado y condiciones de parada.
14. Clasificar el nivel de terminado aplicable sin adelantarlo.

# Condiciones de parada

- El estado Git no puede verificarse.
- Faltan resultados exactos de una acción crítica.
- Existe una desviación no inventariada.
- Se pretende limpiar o alterar evidencia antes del handoff.
- El informe mezcla hechos con inferencias.
- Se solicita declarar éxito de una prueba no ejecutada.
- El siguiente paso carece de responsable o autorización definida.

# Verificaciones

- Todos los campos aplicables de `HANDOFF_TEMPLATE.md` están cubiertos.
- Estado Git, issue, PR y SHA son actuales.
- Acciones ejecutadas, fallidas y no ejecutadas están separadas.
- Archivos y resultados exactos están enumerados.
- Pendientes, riesgos y prohibiciones son visibles.
- El nivel de terminado coincide con `DEFINITION_OF_DONE.md`.
- El handoff no autoriza la siguiente acción.

# Formato de salida humano

Usar esta estructura:

1. Fase, paso y objetivo.
2. Repositorio, referencia estable y estado Git.
3. Issue, PR, alcance y fuera de alcance.
4. Fuentes, decisiones y supuestos.
5. Trabajo completado y archivos.
6. Comandos, herramientas y resultados exactos.
7. Verificaciones y evidencia.
8. Fallos, desviaciones, pendientes y riesgos.
9. Nivel de terminado.
10. Siguiente responsable, acción exacta y autorización requerida.
11. Resultado esperado y condiciones de parada.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-handoff",
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
    "phase": "fase identificada",
    "step": "paso identificado",
    "base_sha": "sha base verificable",
    "head_sha": "sha head verificable",
    "git_status": "estado Git observado",
    "pnpm_verify": "NOT_RUN",
    "pending_items": [],
    "next_action": "acción recomendada"
  },
  "recommended_next_state": "HUMAN_ACKNOWLEDGEMENT_REQUIRED"
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
- `data` debe contener como mínimo `phase`, `step`, `base_sha`, `head_sha`, `git_status`, `pnpm_verify`, `pending_items` y `next_action`.
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
