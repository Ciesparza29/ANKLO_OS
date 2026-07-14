# ADR 0005: inventario operativo, ATP y conciliación

- **Identificador:** ADR-0005
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

Migo mantendrá durante 2026 el stock contable oficial de Distripernos. ANKLO-OS debe proyectar la disponibilidad operativa considerando eventos todavía no reflejados en Migo y compararla con conteos físicos. Las tres perspectivas tienen autoridades y tiempos distintos:

1. stock contable del último snapshot válido de Migo;
2. stock operativo proyectado por ANKLO-OS;
3. stock físico contado y validado.

Este ADR se limita al inventario propio y operativo vinculado a Distripernos/ANKLO-OS. El inventario de Servipernos, otras fuentes externas y las obligaciones de préstamo pertenecen al ADR 0008.

## Problema

Si se trata un snapshot Migo, una proyección y un conteo como el mismo saldo, la aplicación podría:

- sobrescribir una perspectiva con otra;
- prometer stock ya reservado o pendiente de salida;
- duplicar el efecto de una importación;
- convertir un conteo en ajuste silencioso;
- ocultar diferencias materiales;
- perder trazabilidad al corregir movimientos;
- presentar ATP como stock contable;
- producir carreras entre reservas concurrentes.

## Alcance

- Snapshots inmutables de stock Migo.
- Lotes de importación y su idempotencia.
- Movimientos de inventario operativo.
- Reservas activas.
- Salidas confirmadas pendientes de Migo.
- Ingresos aprobados pendientes de Migo.
- Cuarentena y bloqueos.
- Disponibilidad para prometer (`ATP`).
- Conteos físicos y validación.
- Ajustes, reversos y movimientos correctivos.
- Conciliaciones y estados de diferencia.
- Segregación de funciones.
- Antigüedad del snapshot y degradación explícita.
- Concurrencia, balance, lote/pieza y auditoría.
- Puntos de integración con ADR 0008.

## Fuera de alcance

- Inventario externo completo, confirmaciones de Servipernos y préstamos.
- Facturación, contabilidad o ajustes directos en Migo.
- Diseñar tablas o modelos Prisma.
- Definir tipos reales de archivo o columnas Migo.
- Fijar tolerancias, materialidad o caducidad de snapshot sin aprobación.
- Definir FEFO, valoración o costeo definitivo.
- Diseñar el optimizador de corte, tratado en ADR 0007.
- Definir reglas comerciales de reservas, tratadas en ADR 0006.

## Fuerzas y criterios de decisión

- Saldo reconstruible desde movimientos.
- Separación visible de las tres perspectivas.
- Promesas comerciales conservadoras y explicables.
- Idempotencia ante reimportaciones y reintentos.
- Concurrencia segura de reservas y movimientos.
- Correcciones sin destrucción histórica.
- Conciliación con responsabilidades segregadas.
- Trazabilidad por producto, ubicación, lote o pieza cuando corresponda.
- Funcionamiento con snapshots potencialmente atrasados.
- Compatibilidad con Migo mediante ADR 0004 y con inventario externo mediante ADR 0008.

## Decisión propuesta

### Definiciones conceptuales mínimas

- **Snapshot:** observación inmutable de una fuente para una fecha de corte y granularidad identificadas; no es un movimiento ni un saldo editable.
- **Movimiento:** evento autorizado que explica un cambio del inventario operativo y conserva su contexto, signo, referencia y trazabilidad.
- **Proyección operativa:** resultado reconstruible de aplicar eventos operativos confirmados sobre un snapshot válido, sin convertirlo en stock contable.
- **ATP:** disponibilidad operativa para prometer calculada con los componentes y la vigencia definidos en este ADR; no es existencia física ni saldo oficial.
- **Conteo:** observación física registrada para un alcance y momento determinados; no ajusta por sí mismo ninguna otra perspectiva.
- **Ajuste:** movimiento explícito y autorizado que explica una diferencia; no es edición directa de saldo ni sustitución del conteo.
- **Conciliación:** proceso que compara perspectivas o registros relacionados, documenta coincidencias y diferencias y conserva su resolución o estado pendiente.

El PRD podrá desarrollar estados, casos y lenguaje de interfaz, pero no redefine estas separaciones ni es requisito para aceptar el patrón arquitectónico.

### Tres perspectivas independientes

`StockSnapshot` representa una observación inmutable del stock contable de Migo para una entidad, fecha de corte y granularidad disponibles. No es un movimiento de ANKLO-OS ni se actualiza para “ponerlo al día”. Una nueva importación genera otro snapshot o lote relacionado.

El stock operativo proyectado se deriva del snapshot válido seleccionado y de eventos operativos confirmados en ANKLO-OS. El conteo físico es una observación independiente que se valida y concilia; no reemplaza automáticamente ninguna de las otras perspectivas.

### Movimientos y balance

Todo cambio de inventario operativo procede de un movimiento autorizado. El saldo no tendrá una interfaz ordinaria de edición directa. Los movimientos conservan entidad, contexto, producto, ubicación, cantidad, unidad, tipo, referencia, actor y tiempo; lote o pieza se añaden cuando la trazabilidad del producto lo requiera.

Una corrección crea un movimiento de reverso enlazado y un nuevo movimiento correcto. El movimiento original permanece. La regla de balance y los movimientos compuestos se precisarán en el modelo lógico sin inventar tipos no aprobados.

### Disponibilidad para prometer

Conceptualmente:

```text
ATP = stock del último snapshot válido de Migo
      - reservas activas
      - salidas confirmadas pendientes de Migo
      + ingresos aprobados pendientes de Migo
      - cuarentena
      - bloqueos
```

La fórmula define componentes mínimos, no una cifra contable. Cualquier extensión —por ejemplo, transferencias, vencimientos, inspecciones, unidades o estados adicionales— requiere una decisión registrada y pruebas; no se infiere para completar el modelo.

El resultado ATP conserva el snapshot utilizado, fecha, componentes, política de vigencia y contexto. Si no existe snapshot válido o supera su vigencia, la política configurada debe bloquear, degradar u ofrecer una advertencia aprobada; nunca presentar el resultado como actual sin indicación.

### Reservas

Las reservas que afectan ATP son compromisos operativos de ANKLO-OS. Su creación, expiración, liberación, conversión o despacho genera eventos idempotentes. La política comercial y los plazos se definen en ADR 0006. Una reserva no modifica stock contable de Migo.

### Pendientes de Migo

Una salida confirmada pendiente reduce ATP antes de verse en el snapshot. Un ingreso aprobado pendiente puede aumentarlo solo cuando el evento, autoridad y estado aprobados lo permitan. Ambos se correlacionan con la cola de ADR 0004 y permanecen diferenciados de movimientos contables externos.

### Cuarentena y bloqueos

Cantidades en cuarentena o bloqueadas se excluyen de ATP según estados aprobados. La liberación requiere autoridad y evento; no se logra editando un indicador sin historial.

### Conteos físicos y ajustes

Un conteo físico registra sesión, alcance, actor, cantidades observadas y validación. El supervisor valida el conteo. Una diferencia produce una conciliación; no un ajuste automático. Si se aprueba un ajuste, el dueño autoriza movimientos explícitos que explican su causa.

### Conciliación y segregación

La conciliación relaciona snapshot, proyección, conteo y, cuando aplique, tareas Migo. Sus estados conceptuales deben diferenciar al menos: abierta/pendiente, coincidencia exacta, diferencia en revisión, ajuste pendiente, resuelta y cerrada. Los nombres finales se fijarán en PRD sin borrar transiciones.

Importar o capturar datos, contar, validar un conteo, aprobar un ajuste y cerrar una conciliación son capacidades diferenciadas. Las autoridades concretas se asignarán mediante una matriz aprobada por contexto y materialidad; no se presume autoridad por el nombre del cargo. Una coincidencia inequívoca puede conciliarse automáticamente solo bajo una regla aprobada y sin autorizar por ello un ajuste.

La misma persona no crea y aprueba un ajuste sensible, salvo una excepción expresa, justificada y auditada conforme a la autoridad definida en la matriz. Las diferencias materiales se escalan a la autoridad configurada y no se cierran por la mera pertenencia a un rol nominal.

### Importaciones

Cada lote es inmutable, auditado e idempotente. Reimportar el mismo lote lógico no aplica dos veces su efecto. Una importación no modifica otra; una corrección externa se incorpora como un nuevo lote relacionado después de comprender su semántica real.

## Invariantes

- El stock operativo no se edita directamente.
- Todo cambio procede de un movimiento autorizado.
- Una corrección usa reverso y nuevo movimiento.
- El movimiento original no se sobrescribe.
- Una importación no modifica retroactivamente otra importación.
- La misma importación lógica no puede aplicarse dos veces.
- ATP no equivale a stock contable.
- Un snapshot no equivale a un movimiento.
- Un conteo físico no sobrescribe silenciosamente saldos.
- Toda diferencia queda explicada, resuelta o pendiente de conciliación.
- Una reserva no modifica Migo.
- Un snapshot vencido no se presenta como actual sin degradación visible.
- La concurrencia no puede reservar o consumir dos veces la misma disponibilidad.
- Cuarentena y bloqueos no forman parte de ATP mientras estén activos.
- Ajustes sensibles respetan segregación y auditoría.
- Ningún nombre de cargo concede por sí solo capacidad para validar, ajustar o cerrar una conciliación.
- Stock externo no confirmado no se agrega al stock propio.

## Límites de responsabilidad

- ADR 0004 provee autoridad Migo, importaciones y cola; inventario no interpreta columnas externas.
- Este dominio controla movimientos, reservas que afectan ATP, conteos y conciliación propia.
- ADR 0006 solicita y libera reservas comerciales mediante contratos públicos; no edita saldos.
- ADR 0007 produce movimientos y piezas al ejecutar cortes; un plan no cambia inventario.
- ADR 0008 expone disponibilidad/entregas externas sin fusionarlas con stock propio.
- Contabilidad determina efectos oficiales en Migo; ANKLO-OS conserva tareas y referencias.

## Alternativas consideradas

### Usar únicamente el saldo Migo

Rechazada porque no refleja reservas ni eventos confirmados pendientes y puede sobreprometer.

### Convertir ANKLO-OS en fuente contable

Rechazada por la coexistencia aprobada durante 2026 y por alcance tributario/contable.

### Mantener un saldo editable

Rechazada porque impide reconstrucción, facilita correcciones silenciosas y debilita auditoría.

### Sobrescribir el snapshot con el conteo físico

Rechazada porque confunde realidad observada con registro contable y elimina la diferencia que debe conciliarse.

### Importar cada archivo como movimientos definitivos

Rechazada porque aún se desconoce si los XLS contienen saldos, movimientos o correcciones.

### Sumar inventario externo al ATP propio

Rechazada. Una fuente externa se trata mediante ADR 0008 y solo puede respaldar abastecimiento con estado y vigencia explícitos.

## Consecuencias positivas

- Disponibilidad explicable y más cercana al compromiso real.
- Reconstrucción del saldo y correcciones trazables.
- Diferencias visibles entre sistema, proyección y realidad física.
- Menor riesgo de doble importación y doble reserva.
- Base consistente para cotizaciones y corte.
- Segregación de ajustes sensibles.

## Consecuencias negativas

- Mayor complejidad que una tabla de saldo.
- Necesidad de políticas de vigencia y degradación.
- Requiere transacciones breves y control de concurrencia.
- Depende de eventos operativos oportunos y disciplinados.
- Las diferencias pueden permanecer abiertas hasta intervención humana.
- La reconstrucción y reportes requieren proyecciones eficientes.

## Riesgos

- Snapshot atrasado usado sin advertencia.
- Eventos pendientes clasificados con autoridad insuficiente.
- Doble reserva por concurrencia.
- Ajuste usado para ocultar una causa no investigada.
- Confundir ingreso esperado con disponibilidad confirmada.
- Unidades o ubicaciones mal mapeadas entre Migo y ANKLO-OS.
- Importación idempotente a nivel de archivo pero duplicada a nivel semántico.
- Sumar stock externo como propio.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                                                                           | Impacto                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué almacenes, ubicaciones y dimensiones de stock reconoce Migo?                                                  | Define la granularidad mínima del snapshot y conciliación.           |
| Evidencia requerida                 | ¿El XLS representa saldo, movimientos o ambos y qué fecha tiene autoridad?                                         | Bloquea contrato de importación y modelo lógico.                     |
| Pregunta bloqueante para aceptación | ¿Qué evento confirma una salida y cuál aprueba un ingreso para afectar ATP?                                        | Evita sumar o restar eventos sin autoridad.                          |
| Pregunta bloqueante para aceptación | ¿Qué política se aplicará cuando el snapshot esté vencido o ausente?                                               | Define seguridad comercial del ATP.                                  |
| Pregunta de implementación          | ¿Qué estados de cuarentena/bloqueo existen y quién los libera?                                                     | Bloquea configuración inicial.                                       |
| Pregunta bloqueante para aceptación | ¿Qué matriz aprobada asigna las capacidades de importar, contar, validar, aprobar ajustes y cerrar conciliaciones? | Sin esa matriz no se presume autoridad por cargo.                    |
| Pregunta de implementación          | ¿Qué clave idempotente identifica lote y fila?                                                                     | Depende de muestras Migo.                                            |
| Decisión configurable               | ¿Cuál es el umbral de diferencia material?                                                                         | Define autoridad de cierre; no cambia la separación de perspectivas. |
| Evidencia requerida                 | ¿Qué productos requieren lote o pieza?                                                                             | Define granularidad, no la invariante de movimiento.                 |
| Pregunta de implementación          | ¿Qué coincidencia habilita conciliación automática?                                                                | Mantiene cierre humano hasta su aprobación.                          |

## Supuestos

- Migo proporciona algún snapshot/exportación de stock, pendiente de prueba real.
- El snapshot puede llegar con retraso respecto a la operación.
- ANKLO-OS conoce reservas y ciertos eventos internos antes que Migo.
- No existe reserva integrada verificada en Migo.
- El inventario externo se mantiene separado del propio.

## Decisiones configurables

- Vigencia máxima del snapshot y comportamiento al vencer.
- Precisión de cantidades visible por rol.
- Duración y tipos de reserva conforme al ADR 0006.
- Estados y autoridades de cuarentena/bloqueo.
- Materialidad de diferencias.
- Frecuencia de conteo.
- Reglas de conciliación automática una vez aprobadas.

Ninguna configuración permite editar saldos, duplicar importaciones o presentar ATP como stock contable.

## Impacto sobre otros dominios

- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md) aporta entidad, unidad y contexto.
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md) aporta snapshots, correlación y cola Migo.
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md) consume ATP y crea reservas/solicitudes.
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md) consume barras/remanentes y produce movimientos reales.
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md) ofrece fuentes externas separadas; una entrega clasificada puede originar movimientos o tareas controladas.
- Campo consume inventario mediante un servicio público; no modifica movimientos directamente.
- Reportes deben exponer perspectiva, fecha y estado de consistencia.

## Impacto de seguridad y auditoría

- Validación servidor de toda orden de movimiento, reserva, conteo y ajuste.
- Autorización por `ActingContext` antes de consultar o mutar.
- Auditoría append-only de importaciones, movimientos, reversos, reservas, conteos, conciliaciones y excepciones.
- Separación de quien cuenta, valida y aprueba el ajuste.
- Protección de costos y ubicaciones según rol.
- Operaciones críticas con identificadores idempotentes.
- Pruebas de acceso cruzado y concurrencia.
- Preservación de XLS originales fuera de la base relacional.

## Estrategia de transición

1. Confirmar autoridad y granularidad del snapshot Migo mediante ADR 0004.
2. Definir catálogo/ubicaciones mínimas y eventos operativos que afectan ATP.
3. Aprobar política de snapshot vencido y matriz de segregación.
4. Diseñar casos de movimiento, reverso, reserva, conteo y conciliación antes del modelo lógico.
5. Probar escenarios deterministas con datos ficticios derivados de muestras autorizadas.
6. Incorporar corte e inventario externo solo mediante contratos de ADR 0007/0008.

No se crea migración ni saldo inicial por este ADR.

## Condiciones para pasar a ACEPTADO

- Israel ratifica funcionalmente las tres perspectivas y la fórmula conceptual de ATP.
- Christian ratifica que Migo conserva stock contable oficial durante 2026 y que ANKLO-OS administra la proyección operativa.
- Bodega y contabilidad documentan almacenes/dimensiones disponibles y el significado de al menos una exportación de stock permitida.
- Se cierra la pregunta `IMP-Q-008` con estados y autoridad para salida confirmada e ingreso aprobado.
- Se aprueba una política explícita para snapshot ausente/vencido, con responsable y comportamiento observable.
- Se incorpora una matriz de segregación para importar, revisar, validar conteo, aprobar ajuste y cerrar diferencias.
- Se ejecutan y documentan pruebas de diseño para: importación repetida sin duplicado; reverso y nuevo movimiento; dos reservas concurrentes; snapshot vencido; conteo distinto sin sobrescritura; coincidencia exacta; diferencia material pendiente.
- Se documentan como pendientes la estructura exacta de XLS, materialidad, estados de cuarentena y trazabilidad por producto cuando aún falte evidencia.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-007`, `PROD-010`, `PROD-011`, `PROD-012`, `PROD-013` y `PROD-019`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md).
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `ADR-Q-004`, `LOG-Q-005`, `LOG-Q-006`, `LOG-Q-013`, `LOG-Q-014`, `LOG-Q-020`, `IMP-Q-002`, `IMP-Q-008`, `IMP-Q-010` e `IMP-Q-011`.
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Bosquejo v1.1](../../ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md), inventario basado en movimientos.

## Relaciones con otros ADR

- Depende de ADR 0003 y ADR 0004.
- Proporciona ATP y reservas operativas a ADR 0006.
- Recibe movimientos reales de ADR 0007.
- Mantiene una frontera explícita con ADR 0008.
- No define precios, contratos externos ni parámetros de corte.
