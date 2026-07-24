---
name: anklo-pr-review
description: Revisa de forma independiente un PR o diff de ANKLO-OS, clasifica hallazgos con evidencia y no edita ni aprueba cuando no pudo verificar.
---

# Objetivo

Evaluar un cambio propuesto contra su issue, plan, allowlist, arquitectura, seguridad y criterios de aceptación, preservando independencia del implementador.

# Cuándo usar

- Cuando existe un diff, commit o PR listo para revisión.
- Antes de recomendar integración.
- Después de una remediación que cambia el SHA revisado.
- Cuando CI o una revisión previa detectan desviaciones.

# Cuándo no usar

- Para implementar correcciones.
- Para revisar un SHA distinto del declarado.
- Para sustituir CI, pruebas especializadas o aprobación humana.
- Cuando el revisor participó como implementador y no existe revisión independiente adicional.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/SECURITY_BOUNDARIES.md`.
4. `docs/ai/DEFINITION_OF_DONE.md`.
5. Issue, plan y paquete de trabajo aprobados.
6. Diff o PR completo del SHA actual.
7. Resultados de CI y verificaciones del SHA actual.
8. Fuentes canónicas aplicables a los cambios.

# Entradas

- Número o referencia del PR.
- Base SHA y head SHA.
- Diff completo y lista de archivos.
- Issue, plan, criterios y allowlist.
- Resultados de pruebas y CI.
- Evidencia de implementación y handoff.

# Precondiciones

- Base y head SHA están identificados.
- El diff es completo y corresponde al estado actual.
- El revisor opera en modo de solo lectura.
- Las fuentes y resultados de CI son accesibles.
- No existen secretos en las entradas.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Verificar identidad del PR, base, head, estado y autor.
2. Comparar archivos cambiados contra la allowlist.
3. Revisar cumplimiento del objetivo y criterios de aceptación.
4. Revisar contradicciones con fuentes canónicas.
5. Revisar límites de seguridad, privacidad y autoridad.
6. Revisar arquitectura, contratos, invariantes y trazabilidad cuando apliquen.
7. Revisar pruebas, CI y verificaciones del SHA actual.
8. Clasificar cada hallazgo:
   - `BLOCKING`: impide continuar;
   - `MAJOR`: defecto importante que requiere corrección;
   - `MINOR`: mejora necesaria no bloqueante según el issue;
   - `NIT`: observación opcional.
9. Para cada hallazgo registrar archivo o fuente, ubicación, evidencia, impacto y remediación esperada.
10. Declarar explícitamente lo que no pudo verificarse.
11. Recomendar remediación, nueva verificación o decisión humana; no aprobar merge.

# Condiciones de parada

- El head SHA cambia durante la revisión.
- El diff está truncado o incompleto.
- Existen archivos fuera de la allowlist.
- Se detectan secretos, datos productivos o acceso no autorizado.
- CI corresponde a otro SHA o está ausente cuando es obligatorio.
- Falta el issue, plan o criterio contra el cual revisar.
- Se solicita al revisor editar, aprobarse o fusionar.
- Un hallazgo requiere peritaje especializado no disponible.

# Verificaciones

- Base y head SHA coinciden con el PR revisado.
- Todos los archivos cambiados fueron inspeccionados.
- Cada criterio de aceptación fue evaluado.
- Cada hallazgo tiene evidencia e impacto.
- Lo no verificado está declarado.
- Revisión independiente y aprobación humana permanecen separadas.
- No se autoriza merge.

# Formato de salida humano

Presentar:

1. Veredicto de revisión.
2. Base, head y alcance revisados.
3. Hallazgos ordenados por severidad.
4. Evidencia y remediación por hallazgo.
5. Criterios de aceptación y verificaciones.
6. Elementos no verificados.
7. Riesgos residuales.
8. Siguiente estado recomendado.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-pr-review",
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
    "review_decision": "APPROVE",
    "findings": [],
    "unverified_items": []
  },
  "recommended_next_state": "REVIEW_RESULT_REQUIRED"
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
- `data` debe contener como mínimo `review_decision`, `findings` y `unverified_items`.
- `review_decision` solo puede ser `APPROVE`, `REQUEST_CHANGES`, `BLOCKED` o `NOT_VERIFIABLE`.
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
