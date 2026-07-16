# ADR 0006: cotizaciones, precios, abastecimiento y reservas

- **Identificador:** ADR-0006
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

ANKLO-OS debe permitir que ventas consulte disponibilidad, prepare cotizaciones, solicite abastecimiento y gestione reservas sin exponer costos o márgenes al vendedor. Los precios pueden provenir de políticas configurables, costos de referencia u ofertas alternativas. La aceptación comercial debe conservar exactamente la revisión y el precio aprobados.

Migo seguirá emitiendo los documentos tributarios; ANKLO-OS generará documentos comerciales internos y referencias hacia la orden de venta interna. ATP y movimientos pertenecen al ADR 0005. Inventario externo y préstamos pertenecen al ADR 0008.

## Problema

Sin versionado y separación de autoridad, una cotización enviada podría cambiar por una actualización de costos, una regla nueva o una reserva vencida. Un vendedor podría ver información económica restringida, aprobar su propio precio o prometer disponibilidad desactualizada. Los faltantes podrían aplicar precios inconsistentes por línea y las reservas podrían bloquear stock indefinidamente.

## Alcance

- `Quote` y `QuoteRevision`.
- Estados conceptuales de cotización.
- Envío, aceptación, rechazo y expiración.
- Congelamiento de revisiones.
- `PriceBook`, escenarios P1–P4 configurables, `PricePolicy` y `PriceVersion`.
- Costo de referencia y métodos de margen, recargo, tabla, manual o combinación.
- Redondeo configurable.
- Aprobación de precio y delegación temporal.
- Visibilidad de costo, margen y disponibilidad.
- Reservas blandas y firmes, expiración y liberación.
- `SupplyRequest`, `SupplierOffer` y fuentes alternativas.
- Faltantes y alcance del precio alternativo.
- Referencias hacia pedido y orden de venta interna.
- Servicio de corte comprado y su relación con la ejecución física sin mantener inventario.
- Costos básicos estimados y reales de material y servicio conforme al ADR 0009.
- Recotización causada por faltante o manufactura sin mutar la revisión aceptada.

## Fuera de alcance

- Definir márgenes, recargos, redondeos, descuentos, impuestos o escalas reales.
- Añadir monedas no aprobadas.
- Definir contratos o condiciones de proveedores.
- Emitir facturas o documentos tributarios.
- Diseñar tablas o modelos Prisma.
- Implementar UI, API o motor de reglas.
- Determinar disponibilidad externa o modalidad de préstamo, tratadas en ADR 0008.
- Definir cálculo interno de ATP, tratado en ADR 0005.

## Fuerzas y criterios de decisión

- Inmutabilidad de ofertas enviadas y aceptadas.
- Explicación reproducible de cada precio.
- Segregación entre creación y aprobación.
- Protección de costos y márgenes en servidor.
- Configurabilidad sin perder historia.
- Reservas temporales, expirables e idempotentes.
- Respuesta controlada ante faltantes.
- Vinculación con abastecimiento y ATP.
- Capacidad de usar fuentes alternativas sin tratarlas como stock propio.
- Documentos internos separados de Migo.

## Decisión propuesta

### Cotización y revisiones

`Quote` representa la identidad y ciclo comercial de una cotización. `QuoteRevision` es una versión inmutable de cabecera, líneas, precios, supuestos, vigencia, política y disponibilidad observada al prepararla. Los estados conceptuales deben distinguir al menos borrador, pendiente de aprobación, aprobada internamente, enviada, aceptada, rechazada, expirada y superada por revisión; el PRD precisará transiciones y nombres.

Enviar una revisión la congela. Un cambio posterior genera una nueva `QuoteRevision` relacionada, sin recalcular silenciosamente la anterior. La aceptación identifica una revisión exacta y conserva el precio aprobado aunque después disminuya el costo real, cambie una lista o expire una regla.

### Libros, políticas y versiones de precio

`PriceBook` agrupa escenarios o listas aplicables dentro de un contexto. P1, P2, P3 y P4 son identificadores configurables; no tienen significado rígido en el dominio.

`PricePolicy` describe el método y condiciones de cálculo. `PriceVersion` conserva vigencia, entradas, regla, resultado, redondeo, fuente y autoridad. Los métodos admitidos conceptualmente son margen, recargo, tabla, valor manual o combinación configurable. No se fijan valores ni fórmulas concretas en este ADR.

El costo de referencia se trata como dato restringido y versionado, con fuente y fecha. No se asume que un precio residente en Migo sea oficial para ANKLO-OS hasta verificar su alcance conforme al ADR 0004.

Para el primer alcance de manufactura, el costo estimado se limita al valor estimado del material a consumir y al precio estimado o cotizado del servicio de corte. El costo real operativo se limita al valor del material realmente consumido y al valor real cobrado por el servicio. Estos datos son restringidos, versionados y conciliables; no incorporan costos indirectos ni sustituyen los registros contables o tributarios oficiales de Migo.

`CutService` representa el concepto comercial comprado o vendido por ejecutar el proceso y no mantiene inventario físico. Puede relacionarse con una `CutExecution` externa —PROMED en la operación actual— y con su estimación/oferta y cobro real sin confundirse con barras, productos fabricados, remanentes o merma.

### Aprobación y delegación

Solo el dueño aprueba precios como autoridad permanente propuesta. Una `TemporaryDelegation` válida bajo ADR 0003 puede conceder esa capacidad como excepción controlada dentro de alcance, vigencia y límites explícitos; no crea una segunda autoridad permanente. La persona que prepara o registra una oferta no adquiere autoridad de aprobación por ese hecho.

Toda aprobación conserva actor, `ActingContext`, revisión, precio, política, motivo, vigencia y delegación usada. Una delegación vencida o revocada no permite aprobar.

### Visibilidad

- El vendedor no ve costos.
- El vendedor no ve márgenes.
- El dueño puede acceder a costos conforme a su autoridad y contexto.
- Cualquier otro acceso a costos requiere permiso explícito y una decisión o matriz aprobada; no se presume por el nombre del cargo.
- La precisión visible del ATP se determina mediante una política comercial autorizada. La administración técnica puede configurar una política ya aprobada, pero no crearla ni cambiar su autoridad unilateralmente.

La restricción se aplica en servidor, contratos de salida, exportaciones e informes; no solo en la interfaz.

### Abastecimiento y ofertas

El vendedor puede crear una `SupplyRequest` cuando existe faltante o necesita fuente alternativa. Una `SupplierOffer` la registra un actor comercial o de abastecimiento autorizado según la matriz vigente; el rol concreto permanece pendiente de ratificación. La oferta conserva contraparte/fuente, vigencia, cantidades, costo o precio restringido, condiciones conocidas y evidencia. Registrarla no la aprueba ni confirma disponibilidad.

Una fuente externa del ADR 0008 puede responder a la solicitud mediante referencia controlada. Su disponibilidad observada no se transforma en ATP propio.

### Precio ante faltante

Por defecto, cuando se aprueba un precio alternativo por faltante, el nuevo precio se aplica a toda la línea. El dueño puede autorizar que se aplique únicamente a la cantidad faltante. La decisión queda en la revisión y no se recalcula al cambiar el cumplimiento real.

Un faltante, una necesidad de manufactura, un cambio de costo estimado de material o servicio o una nueva oferta de corte pueden requerir recotización según una política comercial aprobada. La recotización crea una nueva `QuoteRevision` con motivo, entradas, costos restringidos, precio y aprobación aplicables. Nunca recalcula ni reemplaza silenciosamente una revisión ya enviada o aceptada. El evento exacto que obliga a recotizar y sus excepciones continúan pendientes de política y casos reales.

### Reservas

Las reservas son compromisos operativos que reducen ATP propio mediante ADR 0005. Se distinguen reservas blandas y firmes. Valores iniciales funcionalmente aprobados:

- autorización interna: 45 minutos;
- reserva blanda: 24 horas;
- máximo ordinario: 48 horas;
- reserva firme: hasta despacho o cancelación.

Una expiración adicional de la reserva firme no forma parte de la regla inicial. Solo puede existir mediante una política comercial aprobada, configurable, versionada y registrada en la reserva afectada. Todos los plazos y políticas son configurables y versionados; no son constantes inmutables del dominio.

Crear, ampliar, convertir, liberar, vencer o consumir una reserva genera un evento auditable e idempotente. Vencer una reserva libera el compromiso operativo, pero no modifica stock contable de Migo.

### Continuidad hacia pedido y orden interna

La aceptación de una revisión puede originar un pedido confirmado y una orden de venta interna que conservan la referencia a `QuoteRevision`, aprobación de precio y reservas aplicables. El registro posterior en Migo sigue ADR 0004.

## Invariantes

- El vendedor no ve costos ni márgenes.
- El vendedor solo ve ATP con la precisión autorizada.
- Solo el dueño aprueba precios, salvo delegación expresa, vigente y auditable.
- Una cotización enviada no cambia silenciosamente.
- Todo cambio posterior a envío genera otra `QuoteRevision`.
- Una cotización aceptada conserva la revisión y precio aprobados.
- Costos, políticas, versiones, vigencias y aprobaciones permanecen históricamente.
- P1–P4 no tienen significado codificado.
- Un precio manual requiere motivo y aprobación.
- Por defecto, el precio alternativo se aplica a toda la línea; la excepción al faltante requiere decisión del dueño.
- Una oferta de proveedor no equivale a aprobación ni disponibilidad confirmada.
- Una reserva termina o se libera mediante evento idempotente; la reserva firme permanece hasta despacho o cancelación salvo una política adicional aprobada y registrada.
- Una reserva no altera stock contable de Migo.
- Cambiar una política no modifica reservas o cotizaciones históricas.
- Un servicio de corte no se presenta como existencia física.
- Costos operativos de manufactura no se presentan como costos contables oficiales.
- Un faltante o cambio de manufactura no recalcula una revisión enviada o aceptada; requiere nueva revisión y aprobación.

## Límites de responsabilidad

- Pricing calcula y versiona; no controla stock ni documentos tributarios.
- Cotizaciones conservan revisiones y aceptación; no emiten factura.
- Inventario/ADR 0005 calcula ATP y ejecuta reservas mediante servicio público.
- Abastecimiento registra solicitudes y ofertas; ADR 0008 gobierna disponibilidad externa y modalidades.
- ADR 0003 gobierna permisos, contexto y delegaciones.
- ADR 0004 gobierna referencias hacia orden/documentos Migo.
- ADR 0009 gobierna proceso, servicio comprado, ejecución, propiedad, custodia y costos básicos de manufactura.
- El sistema no determina validez contractual o tributaria de una aceptación.

## Alternativas consideradas

### Precio mutable en el producto

Rechazada porque pierde vigencias, fuentes, aprobación e historial de cotizaciones.

### Recalcular cotizaciones al abrirlas

Rechazada porque altera ofertas enviadas y puede cambiar compromisos aceptados sin decisión humana.

### P1–P4 rígidos en código

Rechazada porque sus significados son escenarios configurables y pueden cambiar.

### Vendedor con acceso a costo para calcular precio

Rechazada por la decisión de visibilidad y segregación; el cálculo puede ejecutarse en servidor sin revelar entradas restringidas.

### Reservar directamente en Migo

Rechazada como capacidad inicial porque no existe reserva integrada verificada.

### Crear una línea distinta solo para el faltante siempre

Rechazada como regla universal. El comportamiento predeterminado y la excepción pertenecen a una decisión aprobada y versionada.

### No reservar hasta aceptación

Rechazada como única política porque no cubre autorización interna y reserva blanda; los tipos deben ser configurables.

## Consecuencias positivas

- Ofertas reproducibles y defendibles.
- Reglas de precio configurables sin perder historia.
- Menor exposición de costos.
- Aprobación y delegación auditables.
- Reservas temporales que protegen ATP.
- Abastecimiento alternativo integrado sin mezclar propiedad.
- Continuidad clara hacia orden interna y Migo.

## Consecuencias negativas

- Más versiones y estados que una cotización mutable.
- Necesidad de resolver concurrencia entre reservas y aceptación.
- Políticas de vigencia y redondeo deben gobernarse.
- Fuentes alternativas pueden quedar obsoletas antes de aceptar.
- La coexistencia manual con Migo mantiene trabajo operativo adicional.

## Riesgos

- Filtrar costos mediante exportaciones, errores o campos derivados.
- Aprobar con delegación vencida.
- Mantener una reserva después de rechazo o expiración.
- Citar ATP sin fecha o precisión.
- Aplicar precio solo al faltante sin autorización.
- Cambiar una política y recalcular historia.
- Tratar una oferta externa como disponibilidad confirmada.
- Aceptación ambigua sin evidencia y versión exacta.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                                          | Impacto                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué evento y evidencia constituyen envío y aceptación de una cotización?         | Define congelamiento y transición a pedido.                 |
| Pregunta bloqueante para aceptación | ¿Qué roles reales pueden preparar, revisar, enviar y registrar ofertas?           | Necesario para la matriz mínima de segregación.             |
| Evidencia requerida                 | ¿Qué proformas, cotizadores y políticas actuales sirven como casos de referencia? | Permite validar el modelo sin generalizar hojas históricas. |
| Pregunta de implementación          | ¿Qué reglas iniciales de margen, recargo, tabla y redondeo se cargarán?           | Bloquea configuración, no la arquitectura versionada.       |
| Pregunta de implementación          | ¿Qué precisión de ATP verá cada rol/contexto?                                     | Bloquea contratos de consulta.                              |
| Pregunta de implementación          | ¿Qué política aplica cuando ATP está vencido o no disponible?                     | Depende de ADR 0005.                                        |
| Decisión configurable               | ¿Qué nombres y contenido tendrán P1–P4?                                           | No bloquea aceptar que son configurables.                   |
| Decisión configurable               | ¿Cuándo se permiten extensiones sobre 48 horas?                                   | Requiere autoridad y motivo.                                |
| Evidencia requerida                 | ¿Qué alcance tienen los precios residentes en Migo?                               | Impide declararlos fuente oficial sin prueba.               |
| Decisión futura no bloqueante       | ¿Qué descuentos y topes comerciales se permitirán?                                | No se inventan en este ADR.                                 |

## Supuestos

- No existe reserva integrada verificada en Migo.
- El vendedor necesita ATP, no costos ni márgenes.
- Los valores iniciales de reserva son funcionales y pendientes de ratificación documental.
- La aceptación puede registrarse con una revisión exacta, pero su evidencia final está pendiente.
- Las fuentes alternativas pueden responder de forma manual antes de una integración.

## Decisiones configurables

- Nombres, contenido, orden y vigencia de P1–P4.
- Método o combinación de precio.
- Reglas de redondeo aprobadas.
- Precisión de ATP por rol/contexto.
- Plazos y extensiones de reserva.
- Vigencia de ofertas de proveedor.
- Aplicación a toda la línea o solo faltante cuando el dueño lo autorice.
- Alcance y duración de delegaciones.

No son configurables la inmutabilidad de revisiones enviadas, la preservación del precio aceptado ni la restricción de costos al vendedor.

## Impacto sobre otros dominios

- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md) aporta contexto, roles y delegación.
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md) separa orden interna y documentos Migo.
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md) aporta ATP y ejecución de reservas.
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md) puede recibir requisitos desde líneas aceptadas y devolver costos/planes restringidos.
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md) aporta fuentes externas confirmadas y modalidades separadas.
- [ADR 0009](0009-manufactura-corte-subcontratado-propiedad-y-custodia.md) aporta el servicio de corte, costos operativos básicos y ejecución relacionada sin convertir el servicio en inventario.
- Reportes y auditoría deben respetar visibilidad de costos y versión aceptada.

## Impacto de seguridad y auditoría

- Autorización servidor por entidad, unidad, rol y acción.
- DTO y exportaciones distintos para vendedores y roles con costo.
- Auditoría de cálculo, versión, aprobación, delegación, envío y aceptación.
- Registro de eventos de reserva y expiración.
- Prevención de autoaprobación cuando el mismo actor prepara y pretende aprobar sin autoridad.
- Protección de ofertas y costos de contraparte.
- Pruebas negativas de visibilidad y delegación.
- Preservación de la evidencia de aceptación con acceso proporcional.

## Estrategia de transición

1. Ratificar estados y autoridades del ciclo de cotización.
2. Recopilar ejemplos reales anonimizados de proformas, cotizadores y aprobaciones.
3. Definir contratos conceptuales de revisión, precio, solicitud, oferta y reserva.
4. Aprobar configuraciones iniciales sin convertirlas en constantes.
5. Validar escenarios de inmutabilidad, delegación, visibilidad, faltante y expiración.
6. Relacionar la revisión aceptada con orden interna y cola Migo sin emitir factura.

Este ADR no autoriza implementar pricing ni cargar datos reales.

## Condiciones para pasar a ACEPTADO

- Israel ratifica funcionalmente entidades conceptuales, estados mínimos y fronteras con ATP/Migo.
- Christian ratifica por escrito: vendedor sin costos/márgenes; dueño como aprobador; delegación temporal; regla predeterminada de precio para toda la línea; preservación del precio aceptado; valores iniciales de reserva.
- Se incorporan ejemplos anonimizados y autorizados de cotización/proforma, cambio de precio, faltante y aceptación.
- Se cierra `IMP-Q-007` con evento, actor, canal y evidencia mínima de aceptación.
- Se incorpora una matriz `acción -> rol -> contexto -> información visible -> aprobación requerida` para cotizar, enviar, aprobar, reservar y registrar ofertas.
- Se documenta una política inicial de expiración/liberación y su relación con rechazo, nueva revisión, pedido y despacho.
- Se ejecutan y documentan pruebas de diseño para: vendedor sin costo/margen; acceso por cargo sin permiso rechazado; delegación vencida rechazada; revisión enviada inmutable; nueva revisión relacionada; aceptación conserva precio; reserva blanda expira una vez; reserva firme continúa hasta despacho o cancelación salvo política adicional aprobada; faltante aplica precio a toda línea; excepción solo faltante exige dueño.
- Se registran como configuración pendiente —no como decisiones arquitectónicas— márgenes, recargos, redondeos, descuentos, impuestos y contenido P1–P4.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-015`–`PROD-019`, `PROD-029`, `PROD-030`, `PROD-039` y `PROD-040`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md).
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `ADR-Q-003`, `LOG-Q-012`, `IMP-Q-003`, `IMP-Q-005`–`IMP-Q-007`, `CFG-001`–`CFG-005`, `CFG-010` y `CFG-011`.
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Auditoría documental previa](../product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md), hallazgos comerciales y de corte.
- [ADR 0009](0009-manufactura-corte-subcontratado-propiedad-y-custodia.md).

## Relaciones con otros ADR

- Depende de ADR 0003–0005.
- Proporciona solicitudes de abastecimiento y requisitos a ADR 0007/0008.
- Genera referencias comerciales internas para ADR 0004.
- No decide stock, propiedad externa, algoritmo de corte ni documentos tributarios.
