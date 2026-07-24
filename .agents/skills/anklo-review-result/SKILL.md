---
name: anklo-review-result
description: Normaliza resultados de revisión de ANKLO-OS, consolida bloqueos y recomienda el siguiente estado sin corregir archivos ni autorizar merge.
---

# Objetivo

Convertir una o más revisiones y verificaciones en una decisión operativa trazable sobre remediación, reverificación o escalamiento humano.

# Cuándo usar

- Después de `anklo-pr-review`.
- Cuando existen resultados de Codex, CI, Antigravity, OpenCode u otras revisiones autorizadas.
- Después de una remediación para determinar qué debe volver a verificarse.
- Antes de solicitar una decisión humana de merge.

# Cuándo no usar

- Para corregir hallazgos.
- Para descartar un bloqueo sin evidencia.
- Para autorizar merge, cierre de issue o deploy.
- Cuando los resultados corresponden a SHA diferentes y no pueden separarse.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/DEFINITION_OF_DONE.md`.
4. Issue, plan y criterios de aceptación.
5. PR, base SHA y head SHA.
6. Resultados completos de revisiones.
7. CI y verificaciones del SHA actual.
8. Evidencia de remediaciones, si existen.

# Entradas

- Informes de revisión.
- Hallazgos y severidades.
- Resultados de CI y pruebas.
- SHA al que corresponde cada resultado.
- Estado del PR e issue.
- Decisiones humanas registradas.

# Precondiciones

- Cada resultado tiene origen, fecha o ejecución y SHA identificables.
- Las revisiones no están truncadas.
- Los estados históricos se diferencian del estado vigente.
- Las fuentes pueden compararse sin modificar nada.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Inventariar cada resultado con herramienta, rol, SHA y estado.
2. Separar resultados vigentes de históricos.
3. Normalizar severidades y terminología sin alterar el significado.
4. Agrupar hallazgos duplicados conservando todas las evidencias.
5. Identificar contradicciones entre revisores.
6. Determinar qué hallazgos están:
   - abiertos;
   - remediados pero no reverificados;
   - verificados como resueltos;
   - pendientes de decisión humana;
   - bloqueados por seguridad.
7. Comparar el estado contra la condición de terminado del issue.
8. Recomendar:
   - `REMEDIATION_REQUIRED`;
   - `RE_VERIFICATION_REQUIRED`;
   - `HUMAN_DECISION_REQUIRED`;
   - `SECURITY_REVIEW_REQUIRED`;
   - `HANDOFF_REQUIRED`;
   - `HUMAN_MERGE_DECISION_REQUIRED`.

   `HANDOFF_REQUIRED` solo puede recomendarse cuando `normalized_result`
   sea `APPROVE`, `verification_complete` sea `true` y `open_findings`
   esté vacío. Deriva el expediente a `anklo-handoff`, pero no ejecuta ni
   autoriza escritura, commit, push, merge o deploy.

9. No convertir CI verde, revisión favorable o árbol limpio en autorización de merge.

# Condiciones de parada

- Los resultados corresponden a SHA incompatibles.
- Falta el informe completo de un revisor requerido.
- Existe un hallazgo bloqueante sin responsable o remediación.
- Una revisión declara éxito sin evidencia.
- Hay contradicción material que requiere arbitraje humano.
- El PR cambió durante la normalización.
- Se solicita corregir archivos o autorizar integración.

# Verificaciones

- Cada resultado está vinculado al SHA correcto.
- Hallazgos abiertos, remediados y verificados están separados.
- Duplicados se consolidaron sin perder procedencia.
- Contradicciones están visibles.
- La condición de terminado se evaluó sin adelantar estados.
- La recomendación no autoriza merge ni deploy.

# Formato de salida humano

Presentar:

1. Estado consolidado.
2. Revisiones y SHA considerados.
3. Hallazgos abiertos por severidad.
4. Hallazgos remediados pendientes de reverificación.
5. Hallazgos verificados como resueltos.
6. Contradicciones y decisiones pendientes.
7. Evaluación de condición de terminado.
8. Siguiente estado y responsable recomendado.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-review-result",
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
    "normalized_result": "APPROVE",
    "findings": [],
    "verification_complete": true,
    "open_findings": []
  },
  "recommended_next_state": "HANDOFF_REQUIRED"
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
- `data` debe contener como mínimo `normalized_result`, `findings`, `verification_complete` y `open_findings`.
- `normalized_result` solo puede ser `APPROVE`, `REQUEST_CHANGES`, `BLOCKED` o `NOT_VERIFIABLE`.
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
