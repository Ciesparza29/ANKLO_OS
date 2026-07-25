# Estado Actual (CURRENT STATE)

## Alcance y autoridad

Este documento resume el estado operativo verificable de ANKLO-OS al corte del 25 de julio de 2026.

No sustituye al PRD, al registro de decisiones, a las preguntas pendientes, a los ADR, a los issues, a los pull requests ni a la evidencia técnica de cada fase. Una propuesta, supuesto o elemento de backlog no se convierte en requisito aprobado por aparecer aquí.

## Referencia estable

Repositorio: `Ciesparza29/ANKLO_OS`
Rama estable: `origin/main`
SHA estable: `2d0b58f3b6776dbeebfe9009900fc8c03ee223d6`

El SHA coincide con `main` y `origin/main` al crear el worktree del Issue #16. Debe revalidarse si `main` avanza antes de integrar esta actualización.

## Funcionalidad ERP integrada en `main`

La rama `main` contiene solicitudes manuales de corte con:

- creación;
- listado;
- detalle;
- envío;
- cancelación;
- historial.

El catálogo de productos contenido en el PR #7 no forma parte del estado estable de `main`.

## Fundaciones de gobierno y seteo integradas

`main` contiene:

- la capa documental persistente de `docs/ai`;
- el modelo operativo y los límites de autoridad de los agentes;
- la matriz de herramientas y los límites de seguridad;
- ocho Skills internas con contratos estructurados;
- el registro controlado de MCP;
- la documentación del piloto bloqueado de Notion MCP.

No hay ningún MCP registrado como habilitado.

## Estado de las fases del seteo

| Fase    | Estado           | Evidencia resumida                                                                                                                                                                                                                |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fase 9  | `CERRADA`        | Issue #12 cerrado y PR #13 fusionado. La capa persistente `docs/ai` forma parte de `main`.                                                                                                                                        |
| Fase 10 | `CERRADA`        | Según su expediente de cierre, Antigravity fue configurado con mínimo privilegio, revisión obligatoria y trabajo mediante worktrees aislados.                                                                                     |
| Fase 11 | `CERRADA`        | Según su expediente de cierre, Codex fue validado como revisor independiente, no interactivo y de solo lectura, con salida estructurada y verificación externa de Git.                                                            |
| Fase 12 | `CERRADA`        | Según su expediente de cierre, OpenCode y Ollama fueron validados como apoyo local restringido; OpenCode no quedó establecido como dependencia obligatoria del futuro orquestador.                                                |
| Fase 13 | `CERRADA`        | Issue #17 cerrado y PR #18 fusionado. Las ocho Skills internas forman parte de `main`.                                                                                                                                            |
| Fase 14 | `CERRADA`        | Issue #21 cerrado y PR #22 fusionado. El piloto de Notion MCP fue bloqueado preventivamente; no hubo OAuth, conexión ni habilitación de MCP.                                                                                      |
| Fase 15 | `EN CIERRE`      | El piloto manual y la auditoría del PR #7 están en ejecución controlada. La decisión sobre el PR #7 ya fue tomada; esta actualización, sus verificaciones, revisión, PR, CI, merge humano y cierre siguen el flujo del Issue #16. |
| Fase 16 | `SIGUIENTE FASE` | Implementar y validar el orquestador local después del cierre verificable de la Fase 15.                                                                                                                                          |

La Fase 15 no está cerrada todavía. La Fase 16 no está autorizada para implementación mientras la Fase 15 permanezca abierta.

## Correcciones históricas verificadas

- Issue #12: `CLOSED`.
- PR #13: fusionado.
- Issue #14: `CLOSED`.
- PR #15: fusionado.
- Issue #17: `CLOSED`.
- PR #18: fusionado.
- Issue #21: `CLOSED`.
- PR #22: fusionado.
- Issue #16: `OPEN`, destinado exclusivamente a actualizar este archivo.

## PR #7 — preservación obligatoria

Número: `#7`
Título: `feat(product): add product detail read model`
Rama: `feat/product-increment-c-read-tests`
Head SHA: `5433f71f777f37e2662c6010963a220d20be7360`
Commits: `12`
Estado: `OPEN`
Integración en `main`: `NO`
Compatibilidad con el `main` vigente: `NO DEMOSTRADA`
Decisión: `PR_7_DECISION=DIVIDIR`

El PR #7:

- no se fusionará directamente;
- no debe cerrarse, borrarse, rebasarse ni reescribirse durante la Fase 15;
- se conserva como expediente histórico, evidencia, trazabilidad y fuente futura de extracción selectiva;
- no autoriza presentar su catálogo como funcionalidad estable;
- no será modificado ni usado para extraer archivos dentro del Issue #16.

## Backlog conceptual PRODUCT-SPLIT

La división conceptual del trabajo del PR #7 es:

1. `PRODUCT-SPLIT-01` — Product core.
2. `PRODUCT-SPLIT-02` — Product persistence.
3. `PRODUCT-SPLIT-03` — Categories and units.
4. `PRODUCT-SPLIT-04` — Reusable product templates.
5. `PRODUCT-SPLIT-05` — Product APIs.
6. `PRODUCT-SPLIT-06` — Administration UI.
7. `PRODUCT-SPLIT-07` — Product detail read model.
8. `PRODUCT-SPLIT-08` — XLSX bulk product import.

Regla de secuencia registrada:

- `PRODUCT_SPLITS=DEFERRED_TO_POST_PHASE_16`.

Estos identificadores son backlog conceptual. Todavía no son issues reales de GitHub y este documento no autoriza crearlos ni implementarlos.

## Estados documentales

PRD: `BORRADOR`
ADR 0001: aceptado provisionalmente para la fundación
ADR 0002: aceptado provisionalmente para orientar cortes futuros
ADR 0003–0009: `PROPUESTO`

Ningún estado documental cambia por esta actualización.

## Contexto empresarial estable

Distripernos es la entidad principal y propietaria actual del inventario.

ANKLO es actualmente una unidad o brazo operativo de Distripernos. La futura ANKLO S.A.S. no se presume constituida.

Migo mantiene durante 2026 la autoridad oficial sobre los procesos contables y tributarios definidos.

ANKLO-OS coordina la operación comercial, inventario operativo, cotización, reservas, corte, campo y conciliación.

Las fuentes funcionales y arquitectónicas vigentes utilizan `PROMED`. Cualquier normalización terminológica a `PROMET` requiere una actualización coordinada posterior de las fuentes canónicas y no se resuelve dentro del Issue #16.

## Decisiones y preguntas pendientes relevantes

Continúan pendientes, entre otras:

- autoridad de atributos del catálogo;
- formatos y capacidades reales de Migo;
- catálogo y unidades reales;
- precisión y reglas de conversión;
- parámetros reales de corte;
- política del optimizador;
- transición futura de ANKLO;
- roles y autoridades concretas;
- tratamiento documentado de PROMET.

Enlace al registro: [Preguntas_Supuestos_Pendientes_v2.0.md](../../docs/product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md)

Estas preguntas no se resuelven mediante inferencia, código adelantado ni decisiones de agentes.

## Riesgos vigentes

- confundir trabajo abierto con estado estable;
- asumir que la CI histórica del PR #7 demuestra compatibilidad actual;
- fusionar directamente el PR #7 pese a la decisión `DIVIDIR`;
- convertir los PRODUCT-SPLIT conceptuales en issues o autorizaciones reales;
- convertir ADR propuestos en decisiones aceptadas;
- resolver preguntas de negocio mediante inferencia;
- habilitar MCP pese al bloqueo preventivo documentado;
- exponer secretos, credenciales, rutas personales o datos productivos;
- permitir que `docs/ai` sustituya fuentes canónicas.

## Próxima acción del Issue #16

Después de esta edición corresponde:

1. revisar el diff completo;
2. confirmar que solo cambió `docs/ai/CURRENT_STATE.md`;
3. ejecutar las verificaciones autorizadas;
4. realizar revisión independiente sin edición;
5. solicitar autorizaciones separadas para commit, push y pull request;
6. exigir CI verde;
7. exigir autorización expresa de Israel antes del merge y mantener su ejecución manual, reservada a una persona autorizada;
8. cerrar el Issue #16 y la Fase 15 solo cuando la integración esté demostrada.

Esta edición no autoriza commit, push, PR, merge, despliegue, modificación del PR #7, creación de PRODUCT-SPLIT ni inicio de la Fase 16.
