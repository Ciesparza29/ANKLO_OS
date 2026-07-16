# Criterios de Aceptación de Manufactura y Corte — Incremento 1

- **Versión:** 1.0
- **Estado:** BORRADOR PARA REVISIÓN
- **Fecha:** 16 de julio de 2026
- **PRD gobernante:** [PRD ANKLO-OS v1.0](../PRD_ANKLO_OS_v1.0.md)
- **ADR principal:** [ADR 0009 — Manufactura, corte y subcontratación](../../adr/0009-manufactura-corte-subcontratado-propiedad-y-custodia.md), estado **PROPUESTO**
- **Aprobación:** pendiente

> Estos escenarios definen comportamiento observable del primer incremento manual. No fijan tablas, endpoints, pantallas, tecnologías, kerf, tolerancias, límites de pérdida, formatos Migo, documentos contables ni cargos no aprobados. Un escenario marcado como pendiente puede guiar diseño y pruebas con datos ficticios, pero no autoriza operación productiva hasta resolver su dependencia.

## 1. Alcance y lectura

El documento cubre solicitud, planificación manual determinista, aprobación, asignación de material, propiedad y custodia, ejecución interna o subcontratada, recepción, conciliación, clases de salida, costo básico, estados, auditoría, aislamiento e idempotencia. El optimizador, la programación de máquinas, los costos indirectos no aprobados y la automatización contable permanecen fuera del incremento.

Cada escenario enlaza un requisito del PRD, al menos una decisión `PROD-028`–`PROD-042`, los ADR aplicables y su estado documental:

- **Aprobado funcionalmente:** respaldado por una decisión `PROD-028`–`PROD-042` cuyo registro dice **APROBADA**; esa aprobación funcional no equivale a validación jurídica, contractual, contable, tributaria o técnica.
- **Propuesto:** depende de un ADR que conserva estado **PROPUESTO**, especialmente para estados y entidades conceptuales.
- **Pendiente de configuración/evidencia:** el comportamiento de bloqueo está definido, pero el valor, actor, formato o evidencia real sigue abierto.

## 2. Escenarios Given/When/Then

### AC-MC-001 — Crear una solicitud completa

- **Trazabilidad:** `FR-CUT-004`; `PROD-028`, `PROD-029`, `PROD-034`, `PROD-040`; ADR 0006, 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; estructura conceptual del ADR 0009 propuesta.
- **Dado** un solicitante autorizado, una organización y datos válidos de producto esperado, cantidad, unidad, prioridad y destino,
- **Cuando** registra y envía la solicitud,
- **Entonces** se crea una solicitud trazable en estado de revisión/planificación sin reservar ni consumir material.

### AC-MC-002 — Bloquear una solicitud sin propietario

- **Trazabilidad:** `FR-CUT-004`, `NFR-VAL-001`; `PROD-034`, `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto; propietario real pendiente cuando aplique.
- **Dado** que una solicitud no identifica al propietario del material requerido,
- **Cuando** el solicitante intenta enviar la solicitud a planificación,
- **Entonces** el servidor la bloquea con la causa por campo y no crea efectos de inventario ni una transición aparente de éxito.

### AC-MC-003 — Conservar propietario y custodio distintos

- **Trazabilidad:** `FR-CUT-001`, `FR-CUT-006`; `PROD-031`–`PROD-033`, `PROD-041`; ADR 0005 y 0009.
- **Estado documental:** confirmado funcionalmente; modelo conceptual propuesto.
- **Dado** material propiedad de Distripernos bajo custodia de un tercero autorizado,
- **Cuando** se consulta o usa como candidato de un plan,
- **Entonces** propietario y custodio se muestran por separado y la ubicación no altera ninguno por inferencia.

### AC-MC-004 — Asignar material a PROMED sin transferir propiedad

- **Trazabilidad:** `FR-CUT-006`; `PROD-030`–`PROD-033`, `PROD-040`; ADR 0005, 0006 y 0009.
- **Estado documental:** confirmado funcionalmente; modalidad, proveedor y evidencia pendientes (`CFG-013`).
- **Dado** un plan aprobado para corte subcontratado por PROMED y una modalidad externa configurada,
- **Cuando** un custodio autorizado asigna la pieza y registra el cambio de custodia operativa,
- **Entonces** se registra el cambio de custodia y su evidencia, Distripernos conserva la propiedad y no se confirma consumo ni transporte físico no evidenciado.

### AC-MC-005 — Impedir doble asignación incompatible

- **Trazabilidad:** `FR-CUT-006`, `NFR-TXN-001`; `PROD-034`, `PROD-041`; ADR 0005 y 0009.
- **Estado documental:** confirmado funcionalmente; transición conceptual propuesta.
- **Dado** que dos operaciones concurrentes intentan asignar la misma cantidad de una pieza,
- **Cuando** ambas confirman la asignación,
- **Entonces** como máximo una obtiene el material disponible y la otra recibe un conflicto explícito sin sobreasignación.

### AC-MC-006 — Preparar un plan manual reproducible

- **Trazabilidad:** `FR-CUT-005`; `PROD-036`, `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; parámetros reales pendientes.
- **Dado** una solicitud, candidatos compatibles y configuración versionada,
- **Cuando** el planificador repite las mismas selecciones, orden y patrones manuales,
- **Entonces** obtiene la misma propuesta y quedan registradas entradas, configuración, versión y autor.

### AC-MC-007 — Aplicar kerf aprobado

- **Trazabilidad:** `FR-CUT-005`; `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** pendiente de evidencia/configuración (`LOG-Q-016`).
- **Dado** un kerf aprobado y vigente para el proceso/máquina aplicable,
- **Cuando** el planificador prepara el balance del patrón,
- **Entonces** el plan usa esa versión y permite reconstruir cómo afectó las longitudes esperadas.

### AC-MC-008 — Bloquear liberación sin kerf o tolerancia

- **Trazabilidad:** `FR-CUT-005`, invariantes 27; `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** bloqueo confirmado; valores pendientes (`LOG-Q-016`, `LOG-Q-021`).
- **Dado** que no existe kerf o tolerancia aprobada para el contexto aplicable,
- **Cuando** se intenta liberar el plan para ejecución productiva,
- **Entonces** la liberación queda bloqueada, se indica la configuración faltante y no se asigna material.

### AC-MC-009 — Aprobar un plan sin consumir material

- **Trazabilidad:** `FR-CUT-005`, `FR-CUT-010`; `PROD-034`, `PROD-040`, `PROD-042`; ADR 0005, 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; estados detallados propuestos.
- **Dado** un plan válido pendiente de aprobación,
- **Cuando** una capacidad autorizada lo aprueba,
- **Entonces** se conserva la revisión aprobada, pero no se crea consumo, pieza resultante ni merma.

### AC-MC-010 — Registrar producto terminado

- **Trazabilidad:** `FR-CUT-003`, `FR-CUT-008`; `PROD-035`, `PROD-037`, `PROD-041`; ADR 0005, 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; precisión pendiente.
- **Dado** una ejecución autorizada con una salida que satisface el producto esperado,
- **Cuando** el ejecutor confirma medidas y cantidad,
- **Entonces** se crea la pieza de producto terminado con genealogía a la entrada y sin crear un SKU por el corte ocasional.

### AC-MC-011 — Clasificar remanente con umbral temporal

- **Trazabilidad:** `FR-CUT-008`; `PROD-036`, `PROD-037`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** regla temporal confirmada y revisable; ratificación/configuración pendiente (`CFG-015`).
- **Dado** una salida no destinada al producto cuya longitud cumple el umbral vigente de remanente,
- **Cuando** se clasifica el resultado,
- **Entonces** queda como remanente reutilizable con la versión del umbral aplicada; las 2 pulgadas no se usan como kerf ni tolerancia.

### AC-MC-012 — Registrar pérdida normal

- **Trazabilidad:** `FR-CUT-008`; `PROD-037`, `PROD-038`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** clase confirmada; reglas y límites pendientes (`LOG-Q-017`, `CFG-016`).
- **Dado** una cantidad no recuperable dentro de una regla de pérdida normal aprobada,
- **Cuando** se confirma la ejecución,
- **Entonces** queda clasificada, medida y balanceada como pérdida normal con la regla vigente registrada.

### AC-MC-013 — Registrar pérdida extraordinaria con aprobación

- **Trazabilidad:** `FR-CUT-008`, `FR-CUT-010`; `PROD-037`, `PROD-038`, `PROD-042`; ADR 0007 y 0009.
- **Estado documental:** escalamiento confirmado; límites y autoridad pendientes (`LOG-Q-022`, `CFG-016`).
- **Dado** que una pérdida excede el límite normal aplicable,
- **Cuando** el ejecutor intenta cerrar la ejecución o conciliación,
- **Entonces** queda como pérdida extraordinaria y solo una aprobación autorizada con causa y evidencia permite continuar al cierre.

### AC-MC-014 — Registrar residuo recuperable

- **Trazabilidad:** `FR-CUT-008`; `PROD-037`, `PROD-041`; ADR 0005, 0007 y 0009.
- **Estado documental:** confirmado funcionalmente.
- **Dado** una salida clasificada como residuo recuperable según regla vigente,
- **Cuando** se confirma la ejecución,
- **Entonces** el residuo participa en el balance como clase separada y no aparece como producto terminado ni remanente reutilizable.

### AC-MC-015 — Reconstruir genealogía completa

- **Trazabilidad:** `FR-CUT-001`, `FR-CUT-003`; `PROD-035`, `PROD-037`, `PROD-041`; ADR 0005, 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; identificación concreta pendiente (`CFG-014`).
- **Dado** una ejecución con producto, remanente y pérdidas,
- **Cuando** un usuario autorizado consulta cualquiera de sus resultados,
- **Entonces** puede recorrer su relación hasta la pieza de entrada, plan y ejecución sin reescribir los hechos originales.

### AC-MC-016 — Comparar plan y ejecución

- **Trazabilidad:** `FR-CUT-003`, `FR-CUT-007`; `PROD-037`, `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; tolerancias pendientes.
- **Dado** un plan aprobado y una ejecución registrada,
- **Cuando** se abre la recepción o conciliación,
- **Entonces** se muestran por separado valores planificados y reales, sus diferencias y la versión de parámetros aplicable.

### AC-MC-017 — Exigir causa para una diferencia

- **Trazabilidad:** `FR-CUT-007`; `PROD-038`, `PROD-040`, `PROD-041`; ADR 0007 y 0009.
- **Estado documental:** confirmado funcionalmente; catálogo de causas pendiente.
- **Dado** que recepción o ejecución difieren del plan fuera de la tolerancia aprobada,
- **Cuando** el conciliador intenta resolver la diferencia,
- **Entonces** debe registrar causa, evidencia, acción y autoridad; el plan aprobado no se modifica.

### AC-MC-018 — Calcular costo básico de material y servicio

- **Trazabilidad:** `FR-CUT-009`; `PROD-030`, `PROD-039`–`PROD-041`; ADR 0004, 0006 y 0009.
- **Estado documental:** alcance confirmado; componentes concretos pendientes (`CFG-017`).
- **Dado** el costo aprobado del material y del servicio de corte, con fuente, moneda y vigencia,
- **Cuando** se calcula el costo básico,
- **Entonces** el total se limita a material más servicio de corte, puede reconstruirse y queda relacionado con ejecución y conciliación.

### AC-MC-019 — Evitar costos indirectos fuera de alcance

- **Trazabilidad:** `FR-CUT-009`; `PROD-039`, `PROD-041`; ADR 0006 y 0009.
- **Estado documental:** confirmado funcionalmente; costos futuros pendientes (`LOG-Q-026`).
- **Dado** un concepto indirecto o sin autoridad aprobada,
- **Cuando** se intenta incorporarlo al costo básico,
- **Entonces** el sistema lo rechaza o mantiene fuera del total, sin inferir asiento contable ni mostrarlo a actores no autorizados.

### AC-MC-020 — Impedir sobrescritura de registros aprobados

- **Trazabilidad:** `FR-CUT-005`, `FR-CUT-010`; `PROD-040`–`PROD-042`; ADR 0005, 0007 y 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto.
- **Dado** un plan, ejecución, recepción o conciliación aprobado/confirmado,
- **Cuando** un actor intenta editar sus valores originales,
- **Entonces** la operación se rechaza y se ofrece únicamente el mecanismo autorizado de revisión, evento o reverso relacionado.

### AC-MC-021 — Auditar correcciones

- **Trazabilidad:** `FR-CUT-010`, `NFR-AUD-001`; `PROD-034`, `PROD-038`, `PROD-041`, `PROD-042`; ADR 0005 y 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto; retención pendiente.
- **Dado** una corrección autorizada sobre un hecho confirmado,
- **Cuando** se registra revisión, evento o reverso,
- **Entonces** la auditoría conserva actor, contexto, fecha, motivo, valores anterior/nuevo y correlación con el original.

### AC-MC-022 — Mantener separación entre organizaciones o unidades

- **Trazabilidad:** `FR-CUT-001`, `FR-CUT-004`, `FR-CUT-006`, `NFR-TEN-001`; `PROD-031`–`PROD-033`, `PROD-041`; ADR 0003, 0005 y 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto; entidades/usuarios reales pendientes.
- **Dado** un usuario con acceso a una organización o unidad solicitante,
- **Cuando** intenta leer o modificar solicitudes, materiales o ejecuciones de otra sin capacidad explícita,
- **Entonces** el servidor rechaza la operación sin mezclar ni revelar datos del otro contexto.

### AC-MC-023 — Manejar reintentos sin duplicación

- **Trazabilidad:** `FR-CUT-010`, `NFR-IDEM-001`; `PROD-041`, `PROD-042`; ADR 0001, 0005 y 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto; clave concreta queda para diseño.
- **Dado** el mismo identificador de operación y contenido para confirmar una ejecución o transición,
- **Cuando** la solicitud se reintenta,
- **Entonces** devuelve el resultado previo o equivalente sin duplicar movimientos, piezas, costos ni eventos.

### AC-MC-024 — Bloquear cantidades negativas o inconsistentes

- **Trazabilidad:** `FR-CUT-003`, `FR-CUT-004`, `FR-CUT-007`, `NFR-VAL-001`; `PROD-037`, `PROD-041`; ADR 0005, 0007 y 0009.
- **Estado documental:** regla funcional documentada; precisión/redondeo pendientes (`LOG-Q-012`).
- **Dado** una cantidad o longitud negativa, no finita, incompatible con la unidad o un balance imposible,
- **Cuando** se intenta guardar solicitud, ejecución o recepción,
- **Entonces** el servidor rechaza la entrada con causa explícita y no genera efectos parciales.

### AC-MC-025 — Cerrar únicamente con conciliación y aprobación

- **Trazabilidad:** `FR-CUT-007`, `FR-CUT-008`, `FR-CUT-010`; `PROD-038`, `PROD-041`, `PROD-042`; ADR 0009.
- **Estado documental:** regla funcional documentada; ADR propuesto; autoridad y límites pendientes.
- **Dado** una ejecución recibida con todas las cantidades balanceadas y diferencias resueltas por capacidad válida,
- **Cuando** el conciliador solicita el cierre,
- **Entonces** se registra el cierre y su evidencia; si falta conciliación o una aprobación requerida, permanece abierta.

### AC-MC-026 — Mantener visible el pendiente futuro con Migo

- **Trazabilidad:** `FR-CUT-007`, `FR-CUT-009`; `PROD-039`–`PROD-042`; ADR 0004 y 0009.
- **Estado documental:** frontera funcional documentada; eventos y formatos pendientes (`LOG-Q-023`–`LOG-Q-025`).
- **Dado** una ejecución que requiere un registro o referencia externa según una regla aprobada,
- **Cuando** termina la conciliación interna sin evidencia Migo suficiente,
- **Entonces** queda un pendiente correlacionado y visible; no se inventa documento ni se marca conciliado por una referencia aislada.

### AC-MC-027 — Cancelar sin borrar historia

- **Trazabilidad:** `FR-CUT-010`; `PROD-034`, `PROD-041`, `PROD-042`; ADR 0009.
- **Estado documental:** regla funcional documentada; transiciones detalladas propuestas.
- **Dado** una solicitud, plan o ejecución cancelable en su estado actual,
- **Cuando** una capacidad autorizada registra causa y cancela,
- **Entonces** se añade la transición, se liberan solo compromisos permitidos y permanecen consultables versiones y hechos anteriores.

### AC-MC-028 — Controlar concurrencia y preservar evidencia

- **Trazabilidad:** `FR-CUT-003`, `FR-CUT-006`, `FR-CUT-007`, `NFR-TXN-001`, `NFR-FIL-001`; `PROD-030`, `PROD-034`, `PROD-035`, `PROD-037`, `PROD-041`; ADR 0005 y 0009.
- **Estado documental:** reglas funcionales documentadas; ADR propuesto; formatos y retención pendientes.
- **Dado** acciones concurrentes sobre una misma pieza y evidencia original de entrega, medición o recepción,
- **Cuando** el sistema resuelve la operación válida y almacena o transforma la evidencia,
- **Entonces** protege el balance sin transacciones abiertas durante llamadas externas y preserva el original aislado, relacionado con derivados y sin atribuir verdad solo por su hash.

## 3. Trazabilidad decisión → ADR → requisito → aceptación

| Decisión   | ADR aplicable                      | Requisito PRD principal    | Criterios principales                   |
| ---------- | ---------------------------------- | -------------------------- | --------------------------------------- |
| `PROD-028` | ADR 0007 y ADR 0009 propuesto      | `FR-CUT-003`, `004`        | AC-MC-001, 010, 016                     |
| `PROD-029` | ADR 0006 y ADR 0009 propuesto      | `FR-CUT-004`, `009`        | AC-MC-001, 018, 019                     |
| `PROD-030` | ADR 0006 y ADR 0009 propuesto      | `FR-CUT-006`, `009`        | AC-MC-004, 018, 026, 028                |
| `PROD-031` | ADR 0005 y ADR 0009 propuesto      | `FR-CUT-001`, `006`        | AC-MC-003, 004, 022                     |
| `PROD-032` | ADR 0003 y ADR 0009 propuesto      | `FR-CUT-004`, `006`        | AC-MC-022                               |
| `PROD-033` | ADR 0005 y ADR 0009 propuesto      | `FR-CUT-001`, `006`        | AC-MC-003, 022                          |
| `PROD-034` | ADR 0007 y ADR 0009 propuesto      | `FR-CUT-004`–`007`, `010`  | AC-MC-001, 005, 009, 020, 021, 027, 028 |
| `PROD-035` | ADR 0005, 0007 y 0009 propuesto    | `FR-CUT-001`, `003`        | AC-MC-010, 015, 028                     |
| `PROD-036` | ADR 0007 y ADR 0009 propuesto      | `FR-CUT-005`, `008`        | AC-MC-006, 011                          |
| `PROD-037` | ADR 0005, 0007 y 0009 propuesto    | `FR-CUT-003`, `007`, `008` | AC-MC-010–017, 024, 028                 |
| `PROD-038` | ADR 0005 y ADR 0009 propuesto      | `FR-CUT-007`, `008`, `010` | AC-MC-013, 017, 021, 025                |
| `PROD-039` | ADR 0006 y ADR 0009 propuesto      | `FR-CUT-009`               | AC-MC-018, 019, 026                     |
| `PROD-040` | ADR 0007 y ADR 0009 propuesto      | `FR-CUT-002`, `004`, `005` | AC-MC-001, 006–009, 016                 |
| `PROD-041` | ADR 0005–0007 y ADR 0009 propuesto | `FR-CUT-001`–`010`         | AC-MC-002–028                           |
| `PROD-042` | ADR 0009 propuesto                 | `FR-CUT-004`–`010`         | AC-MC-009, 013, 020, 021, 023, 025–027  |

## 4. Condiciones de uso

Los escenarios pueden automatizarse con contratos y datos ficticios cuando no dependan de valores reales. Antes de una prueba productiva deben resolverse, según el caso, `LOG-Q-011`, `LOG-Q-012`, `LOG-Q-016`–`LOG-Q-019`, `LOG-Q-021`–`LOG-Q-025`, `LOG-Q-027`, `LOG-Q-028` y `CFG-013`–`CFG-017`. `IMP-Q-016` decide si el incremento pertenece al MVP general; no altera estos criterios. La aceptación de este documento no cambia el estado **BORRADOR** del PRD ni el estado **PROPUESTO** del ADR 0009.
