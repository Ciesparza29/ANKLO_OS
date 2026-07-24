---
name: anklo-context-check
description: Verifica contexto, fuentes, estado Git, contradicciones y autorizaciones antes de evaluar un issue, planificar o recomendar cualquier ejecución en ANKLO-OS.
---

# Objetivo

Determinar si existe contexto suficiente, consistente y verificable para continuar con una tarea de ANKLO-OS sin inventar requisitos, estados ni autorizaciones.

# Cuándo usar

- Al iniciar una fase, issue, incremento, revisión o handoff.
- Después de cambiar de chat, herramienta, equipo, rama, worktree o referencia base.
- Cuando exista duda sobre fuentes canónicas, estado Git, alcance o autoridad.
- Antes de usar `anklo-issue-readiness`.

# Cuándo no usar

- Para implementar, editar o corregir archivos.
- Para aprobar decisiones de negocio, arquitectura, seguridad, merge o deploy.
- Para sustituir una auditoría especializada que el issue exija.
- Cuando no se dispone de acceso de solo lectura a las fuentes mínimas.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/README.md`.
3. `docs/ai/AGENT_OPERATING_MODEL.md`.
4. `docs/ai/SECURITY_BOUNDARIES.md`.
5. Issue, PR, plan o handoff aplicable.
6. Fuentes canónicas citadas por el issue.
7. Evidencia Git de la referencia estable, rama, HEAD, upstream, divergencia y estado del árbol.
8. Decisiones, ADR y preguntas pendientes aplicables.

Normativa, contrato, planos, RFI, evaluaciones, MPII e instrucciones de fabricante aplicables prevalecen sobre prácticas internas. No combinar versiones antiguas con vigentes.

# Entradas

- Objetivo solicitado.
- Repositorio y referencia estable esperados.
- Issue, PR, plan o handoff relacionado.
- Lista de fuentes declaradas.
- Alcance y archivos autorizados.
- Frase o evidencia de autorización humana, cuando corresponda.
- Estado Git obtenido mediante lectura.

# Precondiciones

- La tarea y el repositorio están identificados.
- Las fuentes pueden leerse sin modificar nada.
- La evidencia pertenece al estado actual y no a una ejecución histórica.
- No se han recibido secretos ni datos productivos sin minimización autorizada.

# Procedimiento

1. Identificar el objetivo exacto y la decisión que se pretende tomar.
2. Enumerar las fuentes disponibles con ruta, versión, estado y procedencia.
3. Clasificar cada afirmación relevante como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`.
4. Verificar que borradores, propuestas, transcripciones y salidas de IA no se estén tratando como requisitos aprobados.
5. Verificar repositorio, rama, HEAD, referencia estable, upstream, divergencia y limpieza del árbol.
6. Comparar el estado actual con el issue, plan, handoff y autorizaciones.
7. Detectar contradicciones entre fuentes, estados o límites de seguridad.
8. Confirmar que el alcance y los archivos autorizados sean explícitos.
9. Registrar vacíos, contradicciones y decisiones pendientes sin completarlos por inferencia.
10. Recomendar continuar, reparar contexto, solicitar decisión o detenerse.

# Condiciones de parada

- La referencia base cambió sin reevaluación.
- El árbol tiene cambios no explicados.
- Existe otra rama o worktree que colisiona con el mismo alcance.
- Faltan fuentes canónicas o no puede determinarse su vigencia.
- Dos fuentes aprobadas se contradicen materialmente.
- Se detectan secretos, datos productivos no saneados o acceso no autorizado.
- La autorización es ambigua, histórica, condicional o corresponde a otra tarea.
- El siguiente paso requiere escribir o ejecutar una acción no autorizada.

# Verificaciones

- Objetivo, repositorio y referencia estable identificados.
- Fuentes listadas con procedencia y estado.
- Hechos separados de inferencias y propuestas.
- Estado Git actual verificado.
- Alcance y archivos autorizados reproducidos sin ampliación.
- Contradicciones y decisiones pendientes registradas.
- Ninguna afirmación crítica depende únicamente de memoria o suposición.

# Formato de salida humano

Presentar, en este orden:

1. Resultado del control de contexto.
2. `HECHOS` verificados.
3. `EVIDENCIA` consultada.
4. `INFERENCIAS` claramente marcadas.
5. `PROPUESTAS`, si existen.
6. `DECISIONES PENDIENTES`.
7. Bloqueos y condiciones de parada.
8. Siguiente estado recomendado.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-context-check",
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
    "context_status": "READY",
    "facts": [],
    "inferences": [],
    "proposals": [],
    "pending_decisions": []
  },
  "recommended_next_state": "ISSUE_READINESS_REQUIRED"
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
- `data` debe contener como mínimo `context_status`, `facts`, `inferences`, `proposals` y `pending_decisions`.
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
