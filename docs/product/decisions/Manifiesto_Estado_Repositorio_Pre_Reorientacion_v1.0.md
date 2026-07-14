# Manifiesto de estado del repositorio previo a la reorientación

**Versión:** 1.0\
**Fecha de captura:** 13 de julio de 2026\
**Rama observada:** `revision-documental-v1.1`\
**Propósito:** distinguir cambios preexistentes de los cuatro documentos autorizados para formalizar la reorientación.\
**Autoría:** este manifiesto no atribuye autoría a cambios preexistentes; su origen se considera desconocido para esta tarea.

## 1. Comandos ejecutados antes de modificar archivos

Se ejecutaron, en este orden y antes de crear los documentos de reorientación:

```text
git status --short
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
```

Resumen observado:

- 9 archivos rastreados modificados.
- 2 archivos rastreados eliminados.
- 12 archivos no rastreados.
- Diff rastreado previo: 11 archivos, 143 inserciones y 140 eliminaciones, además de una eliminación binaria.
- Avisos de conversión futura LF a CRLF en varios archivos rastreados; no se modificaron finales de línea en esta tarea.

## 2. Archivos rastreados modificados antes de la tarea

| Archivo                                  | Estado previo | Clasificación funcional     |                             Canónico | Discovery | Código/configuración | Origen para esta tarea   | Tratamiento |
| ---------------------------------------- | ------------- | --------------------------- | -----------------------------------: | --------: | -------------------: | ------------------------ | ----------- |
| `.env.example`                           | Modificado    | Configuración local         |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |
| `.github/workflows/ci.yml`               | Modificado    | CI/configuración            |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |
| `AGENTS.md`                              | Modificado    | Gobierno del repositorio    |         No; instrucción raíz vigente |        No |                   No | Desconocido/preexistente | No tocar    |
| `docker-compose.yml`                     | Modificado    | Infraestructura local       |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |
| `docs/adr/0001-arquitectura-base.md`     | Modificado    | Decisión de arquitectura    | No canónico del paquete; ADR vigente |        No |                   No | Desconocido/preexistente | No tocar    |
| `docs/architecture/module-boundaries.md` | Modificado    | Arquitectura                |              No canónico del paquete |        No |                   No | Desconocido/preexistente | No tocar    |
| `eslint.config.mjs`                      | Modificado    | Lint/arquitectura           |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |
| `package.json`                           | Modificado    | Scripts y dependencias raíz |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |
| `packages/db/prisma.config.ts`           | Modificado    | Configuración Prisma        |                                   No |        No |                   Sí | Desconocido/preexistente | No tocar    |

## 3. Archivos rastreados eliminados antes de la tarea

| Archivo                                                            | Estado previo | Clasificación funcional                    |                             Canónico vigente | Origen para esta tarea   | Tratamiento             |
| ------------------------------------------------------------------ | ------------- | ------------------------------------------ | -------------------------------------------: | ------------------------ | ----------------------- |
| `ANKLO_Paquete_Documental_v1.0/Resumen_Ejecutivo_ERP_ANKLO_OS.pdf` | Eliminado     | Artefacto documental histórico del paquete | No figura entre los cinco canónicos vigentes | Desconocido/preexistente | No restaurar ni incluir |
| `ANKLO_Paquete_Documental_v1.0/gemini-code-1783690414711.md`       | Eliminado     | Fuente/artefacto documental histórico      |                                           No | Desconocido/preexistente | No restaurar ni incluir |

## 4. Archivos no rastreados antes de la tarea

| Archivo                                                                  | Estado previo | Clasificación funcional          |                                 Canónico | Discovery | Código/configuración | Origen para esta tarea   | Tratamiento     |
| ------------------------------------------------------------------------ | ------------- | -------------------------------- | ---------------------------------------: | --------: | -------------------: | ------------------------ | --------------- |
| `ANKLO_Paquete_Documental_v1.0/AGENTS.md`                                | No rastreado  | Gobierno documental local        |                                       No |        No |                   No | Desconocido/preexistente | Leer y no tocar |
| `ANKLO_Paquete_Documental_v1.0/NOTAS_REUINION_ADMIN_ANKLO.md`            | No rastreado  | Fuente de reunión/discovery      |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `README.md`                                                              | No rastreado  | Documentación de desarrollo raíz |                                       No |        No |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/adr/0002-puertos-y-adaptadores.md`                                 | No rastreado  | Decisión de arquitectura         | No canónico del paquete; ADR provisional |        No |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Agenda_Reunion_Decisiones_PRD_v1.0.md`           | No rastreado  | Discovery                        |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md` | No rastreado  | Discovery/auditoría              |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Cuestionario_Decisiones_PRD_v1.0.md`             | No rastreado  | Discovery                        |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Formulario_Decisiones_Bloqueantes_v1.0.md`       | No rastreado  | Discovery                        |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Matriz_Fuentes_Requisitos_v1.0.md`               | No rastreado  | Discovery                        |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Registro_Contradicciones_v1.0.md`                | No rastreado  | Discovery                        |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `docs/product/discovery/Registro_Decisiones_Stakeholders_v1.0.md`        | No rastreado  | Discovery/plantilla              |                                       No |        Sí |                   No | Desconocido/preexistente | Leer y no tocar |
| `scripts/check-architecture.mjs`                                         | No rastreado  | Validación de arquitectura       |                                       No |        No |                   Sí | Desconocido/preexistente | No tocar        |

## 5. Documentos canónicos protegidos

Los siguientes documentos canónicos fueron leídos y no presentaban modificaciones visibles en `git status --short` al iniciar la tarea. Quedan expresamente fuera del alcance de edición:

- `ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md`
- `ANKLO_Paquete_Documental_v1.0/README.md`
- `ANKLO_Paquete_Documental_v1.0/Glosario_Maestro_ANKLO_v1.1-borrador.md`

También quedan protegidos y sin modificación por esta tarea:

- `docs/adr/0001-arquitectura-base.md`
- `docs/adr/0002-puertos-y-adaptadores.md`
- `docs/architecture/module-boundaries.md`
- `docs/decisions/open-questions.md`
- `docs/backlog/sprint-0.md`
- `AGENTS.md`
- `README.md`
- `packages/db/prisma/schema.prisma`
- todo archivo bajo `apps/`, `packages/`, `.github/` y `scripts/`.

## 6. Archivos autorizados para esta tarea

Este manifiesto distingue del estado previo únicamente estos cuatro archivos nuevos:

1. `docs/product/decisions/Registro_Decisiones_Producto_v2.0.md`
2. `docs/architecture/mapa-fuentes-de-verdad-v1.0.md`
3. `docs/product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md`
4. `docs/product/decisions/Manifiesto_Estado_Repositorio_Pre_Reorientacion_v1.0.md`

No se autorizó incluir, corregir, formatear, restaurar, renombrar o eliminar ningún otro archivo.

## 7. Criterio de comparación posterior

Al finalizar, el estado esperado es el estado previo intacto más los cuatro archivos nuevos indicados. Cualquier cambio adicional deberá tratarse como desviación y detener la entrega hasta identificar su origen.
