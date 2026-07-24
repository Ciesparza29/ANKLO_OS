---
name: anklo-issue-readiness
description: Evalúa si un issue de ANKLO-OS contiene información suficiente y aprobada para planificar o implementar, sin completar vacíos por inferencia.
---

# Objetivo

Clasificar la preparación de un issue y señalar exactamente qué falta antes de planificar o implementar.

# Cuándo usar

- Después de `anklo-context-check`.
- Antes de diseñar un plan de incremento.
- Cuando un issue fue creado, ampliado o cambió de alcance.
- Cuando una revisión detecta requisitos, aceptación o autoridad incompletos.

# Cuándo no usar

- Para escribir la solución o implementar archivos.
- Para aprobar el issue en nombre de Israel.
- Para convertir el texto del issue en autorización de ejecución.
- Para completar requisitos funcionales, jurídicos, contables, técnicos o de SST no confirmados.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/ISSUE_READINESS.md`.
4. `docs/ai/SECURITY_BOUNDARIES.md`.
5. `docs/ai/DEFINITION_OF_DONE.md`.
6. El issue completo y sus comentarios aplicables.
7. Decisiones, ADR, preguntas pendientes y fuentes canónicas citadas.
8. Evidencia del estado actual del repositorio cuando sea relevante.

# Entradas

- Número, URL, título, estado y cuerpo del issue.
- Comentarios y decisiones humanas aplicables.
- Resultado vigente de `anklo-context-check`.
- Referencia estable y base SHA.
- Alcance, fuera de alcance y archivos autorizados.
- Frase de autorización requerida o ya emitida.

# Precondiciones

- El contexto no está bloqueado.
- El issue es accesible y su estado actual fue verificado.
- Las fuentes citadas existen y su vigencia puede evaluarse.
- Las decisiones humanas están diferenciadas de propuestas.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Verificar `Problema` y `Objetivo`.
2. Registrar fuente, ruta, versión y estado de cada requisito relevante.
3. Identificar la decisión aplicable y su aprobador.
4. Verificar evidencia y trazabilidad.
5. Comprobar alcance, fuera de alcance y archivos autorizados.
6. Comprobar criterios de aceptación observables.
7. Comprobar dependencias y bloqueos.
8. Comprobar riesgos, datos de prueba, privacidad e impacto arquitectónico.
9. Comprobar verificaciones exigidas, corrección o reversión y condiciones de parada.
10. Comprobar la frase exacta de autorización requerida.
11. Clasificar el issue sin aprobarlo:
    - `NO_LISTO`;
    - `LISTO_PARA_PLAN`;
    - `LISTO_PARA_IMPLEMENTACION`;
    - `BLOQUEADO`.
12. Traducir esa clasificación al contrato común:
    - `READY` para información suficiente dentro de la etapa evaluada;
    - `NOT_READY` cuando faltan elementos;
    - `BLOCKED_BY_DECISION` cuando falta decisión humana;
    - `BLOCKED_BY_SECURITY` cuando existe un límite de seguridad;
    - `FAILED_VERIFICATION` cuando una comprobación falla.

# Condiciones de parada

- El problema y el objetivo son incompatibles.
- Una fuente clave es borrador, propuesta o no verificable.
- Faltan criterios de aceptación observables.
- El alcance contradice archivos autorizados o fuera de alcance.
- Existe una decisión pendiente que cambia el diseño.
- Se solicitan secretos, producción, merge, deploy o permisos no aprobados.
- La referencia estable o el issue cambió durante la evaluación.

# Verificaciones

- Se revisaron todos los campos de `ISSUE_READINESS.md`.
- La clasificación del issue está justificada por evidencia.
- Ningún vacío fue completado por inferencia.
- `LISTO_PARA_PLAN` no se presentó como autorización de implementación.
- `LISTO_PARA_IMPLEMENTACION` no se presentó como autorización de escritura.
- La condición de terminado corresponde al tipo de issue.

# Formato de salida humano

Presentar:

1. Clasificación propuesta del issue.
2. Resumen de problema y objetivo.
3. Matriz de campos completos, incompletos o bloqueados.
4. Fuentes y decisiones aplicables.
5. Alcance y archivos autorizados.
6. Criterios de aceptación y verificaciones.
7. Riesgos, decisiones pendientes y bloqueos.
8. Frase de autorización humana requerida.
9. Siguiente estado recomendado.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-issue-readiness",
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
    "issue_readiness": "READY",
    "missing_fields": [],
    "pending_decisions": []
  },
  "recommended_next_state": "PLAN_REQUIRED"
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
- `data` debe contener como mínimo `issue_readiness`, `missing_fields` y `pending_decisions`.
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
