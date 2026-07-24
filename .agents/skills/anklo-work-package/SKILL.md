---
name: anklo-work-package
description: Convierte un issue y un plan aprobados en un paquete de trabajo estructurado para un ejecutor, sin crear ramas, worktrees ni iniciar la ejecución.
---

# Objetivo

Producir un mandato operativo completo, autocontenido y limitado que pueda ser evaluado por `anklo-dispatch-readiness`.

# Cuándo usar

- Después de que Israel aprueba el plan.
- Antes de seleccionar o despachar Antigravity, OpenCode, Codex u otro ejecutor.
- Cuando un paquete previo quedó obsoleto por cambios de base, alcance o herramienta.

# Cuándo no usar

- Para ejecutar comandos o editar archivos.
- Cuando el plan no tiene aprobación humana verificable.
- Cuando el issue, la base o la allowlist cambiaron sin replanteamiento.
- Para elegir unilateralmente permisos más amplios.

# Fuentes obligatorias

1. `AGENTS.md`.
2. `docs/ai/AGENT_OPERATING_MODEL.md`.
3. `docs/ai/SECURITY_BOUNDARIES.md`.
4. Issue aprobado.
5. Plan aprobado y evidencia de aprobación.
6. Matriz de herramientas aplicable.
7. Resultado vigente de controles de contexto y preparación.

# Entradas

- Issue, plan y aprobaciones.
- Base SHA y referencia estable.
- Rama y worktree propuestos, si fueron autorizados.
- Ejecutores permitidos y rol de cada uno.
- Archivos autorizados.
- Permisos mínimos.
- Pruebas, evidencia, kill switch y handoff esperado.

# Precondiciones

- Issue y plan son vigentes.
- La aprobación humana corresponde exactamente al plan.
- La base SHA es verificable.
- El ejecutor propuesto puede operar con mínimo privilegio.
- No hay bloqueos abiertos.

# Procedimiento

Toda afirmación relevante debe clasificarse explícitamente como `HECHO`, `EVIDENCIA`, `INFERENCIA`, `PROPUESTA` o `DECISIÓN PENDIENTE`. La salida humana debe mantener estas categorías separadas: una inferencia no puede presentarse como hecho o evidencia, y una propuesta o decisión pendiente no puede tratarse como requisito aprobado ni como autorización.

1. Identificar issue, plan, aprobador y frase de autorización.
2. Fijar referencia estable y base SHA.
3. Reproducir la allowlist y el fuera de alcance.
4. Definir objetivo y entregables del ejecutor.
5. Definir rol y límites del ejecutor.
6. Definir permisos mínimos de lectura o escritura autorizados.
7. Definir rama y worktree solo cuando ya estén autorizados; no crearlos.
8. Definir secuencia de trabajo, verificaciones y evidencia.
9. Definir condiciones de parada y kill switch.
10. Definir formato de reporte y handoff.
11. Definir siguiente responsable y aprobación requerida.
12. Entregar el paquete para evaluación de despacho.

# Condiciones de parada

- Falta aprobación del plan.
- El paquete amplía alcance, archivos o permisos.
- La rama o el worktree propuestos colisionan.
- El ejecutor necesita secretos, producción, MCP, plugins o dependencias no aprobadas.
- No existe kill switch o condición de parada.
- El paquete combina implementación con revisión independiente o aprobación.
- Cambió el SHA base, issue o plan.

# Verificaciones

- Issue, plan y aprobación están vinculados.
- Base SHA, rama y worktree son explícitos.
- Allowlist y fuera de alcance coinciden con el plan.
- Permisos aplican mínimo privilegio.
- Entregables y pruebas son observables.
- Existe kill switch y handoff.
- El paquete no ejecuta ninguna acción.

# Formato de salida humano

Presentar:

1. Identidad del paquete.
2. Issue, plan y aprobación.
3. Base SHA, rama y worktree.
4. Objetivo, entregables y allowlist.
5. Ejecutores, roles y permisos.
6. Secuencia de ejecución.
7. Pruebas y evidencia.
8. Kill switch y condiciones de parada.
9. Handoff y siguiente responsable.
10. Autorización requerida para despachar.

## Formato de salida estructurado

La ejecución debe terminar con exactamente un objeto JSON válido y ningún texto posterior:

```json
{
  "schema_version": "1.0",
  "skill": "anklo-work-package",
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
    "issue": "issue o URL verificable",
    "base_sha": "sha base verificable",
    "branch": "rama prevista",
    "worktree": "ruta prevista",
    "forbidden_files": [],
    "acceptance_criteria": [],
    "authorized_tools": [],
    "risk_level": "nivel de riesgo verificable",
    "approvals": []
  },
  "recommended_next_state": "DISPATCH_READINESS_REQUIRED"
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
- `data` debe contener como mínimo `issue`, `base_sha`, `branch`, `worktree`, `forbidden_files`, `acceptance_criteria`, `authorized_tools`, `risk_level` y `approvals`.
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
