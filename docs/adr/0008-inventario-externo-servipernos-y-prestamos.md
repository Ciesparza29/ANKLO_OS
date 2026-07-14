# ADR 0008: inventario externo, Servipernos y préstamos

- **Identificador:** ADR-0008
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

Distripernos necesita consultar fuentes alternativas cuando no dispone de stock propio. Servipernos es la primera contraparte externa conocida y puede informar disponibilidad, confirmar cantidades o entregar mercadería bajo modalidades que todavía no están documentadas completamente.

El inventario externo no pertenece a Distripernos por el hecho de ser visible. Observar, confirmar, reservar y entregar son eventos distintos. Una entrega tampoco determina por sí sola si existe préstamo, compra, venta, compensación u otra modalidad.

Los préstamos requieren conservar su origen y registrar liquidaciones posteriores sin convertir retroactivamente el acuerdo inicial. Los efectos contables, tributarios, contractuales y de riesgo durante custodia permanecen sujetos a documentación y autoridad competentes.

## Problema

Si el inventario externo se fusiona con stock propio, ANKLO-OS puede sobreprometer y atribuir propiedad incorrecta. Si toda entrega se clasifica automáticamente como préstamo o compra, se inventa una obligación. Si un préstamo se edita al liquidarse, se pierde la relación entre origen, devoluciones, compras, ventas, compensaciones y saldo.

La disponibilidad externa además puede quedar obsoleta; debe conservar fecha, evidencia, vigencia y nivel de confianza.

## Alcance

- `ExternalCounterparty`.
- `ExternalInventorySource`.
- Servipernos como primera contraparte conocida.
- Inventario observado, confirmado, reservado, entregado y vencido.
- Fecha de observación, evidencia de confirmación y vigencia.
- Registro manual, XLS, confirmación humana y futuro adaptador.
- Propiedad, custodia, entrega y modalidad pendiente.
- Préstamo, compra, venta y compensación como modalidades diferentes.
- `LoanAgreement` u obligación operativa equivalente.
- `LoanMovement`.
- Liquidación total, parcial y mixta.
- Saldo pendiente y referencias documentales.
- Conciliación con contraparte y, cuando corresponda, tarea Migo.

## Fuera de alcance

- Inventar contrato, precio, plazo o condiciones con Servipernos.
- Determinar propiedad/riesgo durante custodia sin evidencia.
- Definir responsabilidad por pérdida o deterioro.
- Definir tratamiento contable, tributario o jurídico.
- Diseñar documentos legales o modelos Prisma.
- Implementar importadores, APIs o portal de contraparte.
- Fusionar stock externo con ATP propio del ADR 0005.
- Definir pricing de ofertas, tratado en ADR 0006.
- Definir cortes de piezas externas antes de su entrega/modalidad, tratado en ADR 0007.

## Fuerzas y criterios de decisión

- Separación inequívoca de propiedad propia y externa.
- Estados de confianza y vigencia de disponibilidad.
- Confirmación humana auditable en modo híbrido.
- Modalidad explícita antes de atribuir obligación.
- Preservación del acuerdo/préstamo original.
- Liquidaciones parciales y mixtas explicables.
- Conciliación con contraparte y Migo sin doble efecto.
- Adaptadores sustituibles para integración futura.
- Trazabilidad de custodia, entrega y documentos.
- Atribución organizacional mediante ADR 0003.

## Decisión propuesta

### Contraparte y fuente externa

`ExternalCounterparty` representa a una contraparte identificada fuera del inventario propio; Servipernos será la primera configurada cuando exista información suficiente. `ExternalInventorySource` describe el canal o fuente autorizada mediante la que se recibe una observación, sin convertirla en propiedad ni garantizar disponibilidad.

Una contraparte puede tener varias fuentes —manual, XLS, confirmación u futura integración— con autoridad, vigencia y evidencia distintas. El formato real permanece pendiente.

### Estados de disponibilidad externa

Se distinguen conceptualmente:

- `OBSERVADO`: información recibida sin confirmación suficiente.
- `CONFIRMADO`: la contraparte o persona autorizada confirmó disponibilidad con fecha y evidencia.
- `RESERVADO`: existe una reserva externa identificable y vigente.
- `ENTREGADO`: hubo transferencia física/custodia documentada.
- `VENCIDO`: la observación, confirmación o reserva dejó de ser utilizable por vigencia.

Los nombres finales podrán ajustarse en PRD, pero las distinciones no se fusionan. Confirmar no reserva; reservar no entrega; entregar no define automáticamente propiedad o modalidad.

### Modo híbrido

Inicialmente se usarán registro manual verificado, XLS y confirmación humana. Cada observación conserva fuente, actor, `ActingContext`, producto/mapeo, cantidad, ubicación si se conoce, timestamp y evidencia permitida. La confirmación añade confirmante, tiempo y vigencia.

Un futuro adaptador podrá recibir datos de una integración verificada sin cambiar los conceptos. La inexistencia actual de una API usable permanece como supuesto, no como restricción permanente.

### Propiedad y custodia

La propiedad del inventario se registra separada de ubicación y custodia. El stock de Servipernos nunca se presenta como stock propio de Distripernos. Una entrega puede cambiar custodia o ubicación sin transferir propiedad. Una transferencia de propiedad requiere modalidad, autoridad y documento aplicables.

### Modalidad de entrega

Cada entrega debe indicar una modalidad aprobada —préstamo, compra, venta, compensación u otra registrada— o quedar `PENDIENTE_CLASIFICACION` de forma visible. Ese estado puede registrar recepción física o custodia, pero no permite presentar la entrega como propiedad propia, incorporarla al ATP propio, venderla, consumirla, cortarla, valorarla, liquidarla ni inferir efectos contables. El bloqueo se mantiene hasta que existan modalidad, autoridad y referencia suficientes.

### Préstamo y obligación

`LoanAgreement` se mantiene como nombre conceptual provisional para preservar la coherencia del ADR. Conserva contraparte, entidad participante, fecha, bienes/cantidades, propiedad declarada, soporte disponible y condiciones conocidas, pero no acredita la existencia, perfección ni validez jurídica de un contrato o acuerdo. El registro original no se sobrescribe al cambiar el saldo o acordar una modalidad posterior.

`LoanMovement` registra eventos posteriores: entrega, devolución, liquidación por compra, venta, compensación, corrección por reverso u otra modalidad aprobada. Cada movimiento conserva referencia al acuerdo y al movimiento/documento relacionado.

### Liquidación

Una obligación puede liquidarse mediante:

- devolución total;
- devolución parcial;
- compra;
- venta;
- compensación;
- combinación de modalidades.

La liquidación parcial conserva saldo. Una liquidación mixta conserva cada componente y no convierte retrospectivamente todo el préstamo. Compra, venta o compensación requieren aprobación y referencia documental; los documentos oficiales que correspondan se registran en Migo conforme al ADR 0004.

### Conciliación

La conciliación externa compara observaciones, confirmaciones, reservas, entregas, movimientos, saldo y referencias documentales con la contraparte. Una diferencia permanece abierta hasta que exista evidencia o decisión autorizada. Conciliar con Servipernos no equivale automáticamente a conciliar el efecto contable en Migo.

### Integración con abastecimiento e inventario propio

ADR 0006 puede usar una confirmación externa vigente como respuesta a `SupplyRequest`, sin sumarla a ATP propio. Solo una entrega clasificada y aceptada puede originar movimientos internos bajo ADR 0005. Si una pieza externa se corta, primero deben estar definidos propiedad, custodia y autorización; después aplica ADR 0007.

## Invariantes

- El inventario de Servipernos no es stock propio de Distripernos.
- Observar disponibilidad no equivale a confirmarla.
- Confirmar no equivale a reservar.
- Reservar no equivale a entregar.
- Una disponibilidad externa puede vencer.
- Una entrega conserva evidencia y debe indicar modalidad o estado pendiente de clasificación.
- Modalidad pendiente no atribuye propiedad, costo o efecto contable.
- Una entrega `PENDIENTE_CLASIFICACION` puede registrar recepción física o custodia, pero no se presenta como stock propio ni se incorpora al ATP propio.
- Una entrega `PENDIENTE_CLASIFICACION` no puede venderse, consumirse, cortarse, valorarse, liquidarse ni generar efectos contables inferidos hasta contar con modalidad, autoridad y referencia suficientes.
- El préstamo original nunca se sobrescribe.
- Cada liquidación es un movimiento o evento posterior.
- Una liquidación parcial conserva saldo.
- Una liquidación mixta conserva sus componentes.
- No se modifica retroactivamente la propiedad.
- Convertir préstamo en compra, venta o compensación requiere referencia y aprobación.
- Conciliación con contraparte y conciliación Migo son procesos relacionados pero distintos.
- Repetir una importación/confirmación no duplica observaciones, reservas o movimientos.
- Los términos comerciales o jurídicos no se inventan.

## Límites de responsabilidad

- La contraparte es autoridad de su inventario; ANKLO-OS conserva observaciones y confirmaciones operativas.
- Abastecimiento/ADR 0006 solicita y evalúa ofertas; no cambia propiedad.
- Inventario propio/ADR 0005 recibe una entrega clasificada mediante contratos públicos; no consulta internals externos.
- ADR 0004 gobierna tareas y documentos Migo cuando exista efecto oficial.
- ADR 0007 solo consume piezas externas después de autorización y clasificación.
- Contratos/contabilidad determinan efectos jurídicos, contables y tributarios; el software no los infiere.
- Auditoría preserva eventos, pero no prueba por sí sola propiedad o validez contractual.

## Alternativas consideradas

### Sumar disponibilidad externa al stock propio

Rechazada porque presenta propiedad ajena como propia y crea promesas no respaldadas.

### Un único estado “disponible”

Rechazada porque elimina diferencias entre observación, confirmación, reserva, entrega y vencimiento.

### Clasificar toda entrega como préstamo

Rechazada porque la modalidad depende de acuerdos y documentos no aportados.

### Modificar el préstamo al liquidarlo

Rechazada porque borra el acuerdo original, dificulta saldos parciales y permite conversiones retroactivas.

### Tratar compra/venta/compensación como estados del préstamo

Rechazada como sustitución del original. Son eventos de liquidación relacionados y pueden producir documentos oficiales independientes.

### Integrar Servipernos dentro del adaptador Migo

Rechazada porque son fuentes, autoridades y relaciones diferentes; compartir un adaptador ocultaría responsabilidades.

### Esperar una API antes de operar

Rechazada porque el modo híbrido permite evidencia y confirmación manuales, siempre que sus limitaciones sean visibles.

## Consecuencias positivas

- Propiedad externa visible y separada.
- Menor riesgo de sobrepromesa.
- Confirmaciones con vigencia y evidencia.
- Préstamos y liquidaciones trazables.
- Soporte para devoluciones parciales y modalidades mixtas.
- Evolución a integración futura sin reescribir el dominio.
- Conciliación independiente con contraparte y Migo.

## Consecuencias negativas

- Más estados y validaciones que un inventario agregado.
- Trabajo manual mientras no exista integración.
- Modalidades pendientes pueden bloquear uso o contabilización.
- Requiere disciplina documental y confirmaciones oportunas.
- La conciliación mixta puede ser compleja y requerir intervención humana.

## Riesgos

- Confirmación vencida usada como vigente.
- Propiedad externa mostrada como propia en reportes.
- Entrega sin modalidad usada para vender o consumir.
- Contrato verbal convertido en regla de software.
- Sobreliquidación o saldo negativo.
- Compra/venta registrada dos veces entre ANKLO-OS y Migo.
- Pérdida/deterioro durante custodia sin responsabilidad definida.
- Mapeo incorrecto de productos entre contraparte y catálogo.
- Acceso indebido a precios o condiciones de contraparte.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                               | Impacto                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué documento o acuerdo real regula la relación con Servipernos?      | Sin evidencia no se pueden ratificar modalidades, propiedad ni autoridad. |
| Pregunta bloqueante para aceptación | ¿Quién conserva propiedad y riesgo durante entrega/custodia?           | Define frontera mínima entre inventario externo y propio.                 |
| Pregunta bloqueante para aceptación | ¿Qué modalidades están realmente autorizadas y quién las aprueba?      | Evita codificar préstamo/compra/venta por inferencia.                     |
| Evidencia requerida                 | ¿Qué formato y actor confirman disponibilidad o reserva?               | Define evidencia, vigencia y nivel de confianza.                          |
| Pregunta de implementación          | ¿Cuál es la estructura real de XLS de Servipernos?                     | Bloquea adaptador, no los estados conceptuales.                           |
| Pregunta de implementación          | ¿Cómo se mapean productos/unidades con el catálogo?                    | Bloquea importación y ofertas.                                            |
| Decisión configurable               | ¿Cuándo vence una observación, confirmación o reserva?                 | Debe aprobarse por fuente/modalidad.                                      |
| Evidencia requerida                 | ¿Qué documentos tributarios/contables corresponden a cada liquidación? | Requiere contabilidad; no se decide aquí.                                 |
| Decisión futura no bloqueante       | ¿Existirá una integración oficial?                                     | Solo cambia el adaptador después de verificación.                         |
| Pregunta de implementación          | ¿Cómo se valoran y concilian saldos parciales o mixtos?                | Depende de condiciones reales y documentos.                               |

## Supuestos

- Servipernos es la primera contraparte conocida, pendiente de evidencia contractual.
- No existe integración utilizable verificada con Servipernos.
- El modo inicial será manual verificado, XLS y confirmación humana.
- Las confirmaciones externas tienen vigencia, aunque su duración está pendiente.
- Pueden existir préstamos, pero su modalidad jurídica y contable no está determinada.

## Decisiones configurables

- Vigencia por fuente y estado.
- Actores autorizados para observar, confirmar y reservar.
- Canales/evidencia aceptables tras aprobación.
- Políticas de recordatorio y reconfirmación.
- Modalidades habilitadas por entidad y contraparte después de ratificación.
- Umbrales de conciliación.
- Adaptador de integración cuando exista capacidad verificada.

No son configurables la separación de propiedad, la inmutabilidad del préstamo original ni la trazabilidad de liquidaciones.

## Impacto sobre otros dominios

- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md) determina la entidad participante y contexto de actuación.
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md) recibe tareas/documentos Migo por efectos oficiales.
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md) mantiene stock propio separado y recibe entregas clasificadas.
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md) consulta fuentes externas para abastecimiento y ofertas.
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md) solo transforma material externo después de entrega y autorización.
- Reportes deben etiquetar propiedad, contraparte, estado, fuente y vigencia.
- Gastos/costos no pueden inferir valoración hasta existir modalidad y fuente aprobadas.

## Impacto de seguridad y auditoría

- Autorización por contraparte, entidad, unidad y acción.
- Auditoría de observación, confirmación, reserva, entrega, clasificación y vencimiento.
- Preservación de evidencia y archivos originales.
- Protección de precios, acuerdos y documentos de contraparte.
- Idempotencia de cargas, confirmaciones y liquidaciones.
- Segregación entre registrar entrega, aprobar modalidad y cerrar obligación sensible.
- Auditoría de propiedad/custodia sin afirmar que el registro prueba por sí solo titularidad jurídica.
- Pruebas negativas para impedir suma en ATP propio y sobreliquidación.

## Estrategia de transición

1. Obtener y revisar evidencia contractual/operativa con Servipernos.
2. Definir actores, formato y vigencia de observación/confirmación.
3. Modelar conceptualmente contraparte, fuente y estados antes del adaptador XLS.
4. Registrar entregas nuevas con modalidad explícita o pendiente visible; no reclasificar historia por inferencia.
5. Inventariar préstamos/saldos reales y reconciliarlos antes de cualquier carga inicial.
6. Definir referencias Migo por modalidad con contabilidad.
7. Evaluar integración futura como cambio de adaptador.

Este ADR no autoriza cargar préstamos históricos ni afirmar condiciones no documentadas.

## Condiciones para pasar a ACEPTADO

- Israel ratifica funcionalmente la separación de inventario externo, estados de confianza y ledger de préstamos/liquidaciones.
- Christian ratifica por escrito que el stock de Servipernos no es propio, que una entrega no define automáticamente modalidad y que el préstamo original se preserva.
- Se incorpora al expediente al menos un acuerdo, documento operativo o confirmación formal que permita identificar contraparte, propiedad/custodia y modalidades realmente usadas; si no existe contrato, se documenta expresamente la ausencia y se limita el alcance aceptable.
- Contabilidad documenta qué modalidades requieren registro/documento Migo y confirma que este ADR no define tratamiento tributario.
- Se cierra `ADR-Q-006` con una matriz `modalidad -> efecto operativo -> referencia oficial requerida -> autoridad`.
- Se aprueba un formato mínimo de observación/confirmación con actor, tiempo, vigencia y evidencia.
- Se ejecutan y documentan pruebas de diseño para: observado no confirmado; confirmado no reservado; reserva vencida; recepción física `PENDIENTE_CLASIFICACION` registrada como custodia; entrega pendiente rechazada para ATP propio, venta, consumo, corte, valoración, liquidación y efecto contable inferido; préstamo inmutable; devolución parcial con saldo; liquidación mixta; sobreliquidación rechazada; stock externo excluido de ATP propio.
- Se registran como pendientes precios, plazos, pérdida/deterioro, compensación, formato XLS e integración cuando no exista evidencia suficiente.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-022`, `PROD-023` y `PROD-024`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md), disponibilidad/entrega de Servipernos y préstamos.
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `ADR-Q-006`, `LOG-Q-009`, `LOG-Q-010`, `LOG-Q-015`, `IMP-Q-012`, `CFG-008` y `SUP-003`.
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Auditoría documental previa](../product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md), inventario, propiedad, custodia y préstamos.

## Relaciones con otros ADR

- Depende de ADR 0003 y los patrones de integración de ADR 0002/0004.
- Mantiene frontera de propiedad con ADR 0005.
- Responde solicitudes de ADR 0006 mediante confirmaciones controladas.
- Solo entrega material a ADR 0007 después de clasificación y autorización.
- Es independiente porque regula autoridad externa, propiedad, custodia y obligaciones, no solo cantidades de stock propio.
