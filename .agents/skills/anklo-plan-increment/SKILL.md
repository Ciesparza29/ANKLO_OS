---
name: anklo-plan-increment
description: Diseña un plan verificable para un incremento aprobado de ANKLO-OS y se detiene antes de editar hasta recibir autorización humana expresa.
---

# Objetivo

Transformar un issue suficientemente preparado en un plan de ejecución secuencial, limitado y verificable.

# Cuándo usar

- Cuando `anklo-issue-readiness` concluye que existe información suficiente para planificar.
- Antes de crear o modificar archivos.
- Cuando un plan existente quedó obsoleto por cambios de base, alcance o decisiones.

# Cuándo no usar

- Para implementar el plan.
- Cuando el issue está `NO_LISTO` o `BLOQUEADO`.
- Cuando falta una decisión que modifica arquitectura, seguridad, negocio o alcance.
- Para autorizar su propio plan.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/SECURITY_BOUNDARIES.md`.
4. `docs/ai/ISSUE_READINESS.md`.
5. `docs/ai/DEFINITION_OF_DONE.md`.
6. Issue aprobado para planificación.
7. Fuentes canónicas y decisiones citadas por el issue.
8. Resultado vigente de `anklo-context-check` y `anklo-issue-readiness`.

# Entradas

- Issue y clasificación de preparación.
- Base SHA, rama estable y estado Git.
- Archivos autorizados y fuera de alcance.
- Criterios de aceptación.
- Herramientas permitidas.
- Verificaciones obligatorias.
- Riesgos, reversión y condiciones de parada.

# Precondiciones

- El issue está listo para plan.
- El contexto y la base SHA están vigentes.
- El alcance y la allowlist son explícitos.
- No existen bloqueos de seguridad o decisiones pendientes materiales.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Reafirmar objetivo, alcance y fuera de alcance.
2. Enumerar archivos autorizados sin añadir rutas.
3. Descomponer el incremento en pasos pequeños y ordenados.
4. Para cada paso definir:
   - objetivo;
   - entradas;
   - archivos afectados;
   - cambios esperados;
   - verificación;
   - resultado esperado;
   - condición de parada.
5. Separar planificación, implementación, revisión, verificación, aprobación, merge y deploy.
6. Definir datos de prueba ficticios o saneados.
7. Incluir controles de seguridad, privacidad y arquitectura aplicables.
8. Definir corrección o reversión sin usar operaciones destructivas.
9. Definir evidencia que deberá conservarse.
10. Identificar decisiones humanas y frases de autorización necesarias.
11. Terminar con solicitud de aprobación del plan, sin ejecutar ningún paso.

# Condiciones de parada

- El plan necesita un archivo no autorizado.
- Un paso depende de una decisión pendiente.
- La base SHA o el issue cambió.
- La solución exige modificar producción, usar secretos o instalar componentes no aprobados.
- No puede definirse una verificación objetiva.
- El plan mezcla implementación con autoaprobación, merge o deploy.
- La reversión propuesta requiere borrar o sobrescribir sin mandato específico.

# Verificaciones

- Cada criterio de aceptación está cubierto por uno o más pasos.
- Cada archivo afectado pertenece a la allowlist.
- Cada paso tiene verificación y condición de parada.
- Las pruebas no dependen de datos reales innecesarios.
- Las funciones de implementar, revisar, verificar y aprobar están separadas.
- El plan no ejecuta ni autoriza cambios.

# Formato de salida humano

Presentar:

1. Objetivo y base verificada.
2. Alcance, fuera de alcance y allowlist.
3. Supuestos y decisiones pendientes.
4. Plan numerado por pasos.
5. Verificaciones y evidencia por paso.
6. Riesgos y mitigaciones.
7. Corrección o reversión.
8. Condiciones de parada.
9. Frase exacta de aprobación requerida.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-plan-increment",
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
    "base_sha": "sha base verificable",
    "steps": [],
    "multi_tenant_impact": {},
    "migrations": [],
    "mitigations": []
  },
  "recommended_next_state": "HUMAN_PLAN_APPROVAL_REQUIRED"
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
- `data` debe contener como mínimo `base_sha`, `steps`, `multi_tenant_impact`, `migrations` y `mitigations`.
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
