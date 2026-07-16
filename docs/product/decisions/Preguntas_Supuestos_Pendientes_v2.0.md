# Preguntas, supuestos y configuraciones pendientes ANKLO-OS

**Versión:** 2.0\
**Fecha:** 13 de julio de 2026\
**Estado:** registro vivo previo a ADR, modelo lógico e implementación.\
**Regla:** una pregunta abierta no autoriza una respuesta por inferencia; un supuesto temporal es operable solo dentro del alcance y criterio de revisión indicados.

## 1. Referencias

- [Registro de decisiones de producto v2.0](./Registro_Decisiones_Producto_v2.0.md)
- [Mapa de fuentes de verdad v1.0](../../architecture/mapa-fuentes-de-verdad-v1.0.md)
- [Preguntas abiertas anteriores](../../decisions/open-questions.md)
- [Formulario de discovery anterior](../discovery/Formulario_Decisiones_Bloqueantes_v1.0.md)
- [Manual Maestro v1.1](../../../ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md)
- [ADR 0009: manufactura, corte subcontratado, propiedad y custodia](../../adr/0009-manufactura-corte-subcontratado-propiedad-y-custodia.md)

## A. Preguntas que bloquean los ADR

| ID        | Pregunta                                                                                                                                                | ADR afectado                                 | Autoridad/evidencia requerida                           | Consecuencia si no se resuelve                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ADR-Q-001 | ¿Qué identificador y denominación tendrá el `BusinessGroup`, y qué entidades legales iniciales pertenecen formalmente a él?                             | Modelo grupo–entidad–unidad                  | Christian y documentos societarios/fiscales disponibles | El ADR puede definir el patrón, pero no poblar organizaciones reales como hechos aprobados |
| ADR-Q-002 | ¿Qué fuente gobierna cada atributo del catálogo: código contable, descripción comercial, unidad, especificación técnica, equivalencias y producto base? | Catálogo e integración                       | Dueño, bodega, ventas y muestras Migo                   | No puede cerrarse el límite entre catálogo oficial externo y enriquecimiento operativo     |
| ADR-Q-003 | ¿Migo mantiene listas de precios con autoridad operativa o solo valores de referencia, y cuáles listas/entidades/monedas cubre?                         | Precios y coexistencia Migo                  | Dueño, ventas, contabilidad y evidencia de Migo         | El ADR no puede afirmar una autoridad de precios no aprobada                               |
| ADR-Q-004 | ¿Qué almacenes, ubicaciones y dimensiones de stock reconoce Migo y cómo se corresponden con almacenes operativos y externos?                            | Inventario, snapshots y conciliación         | Bodega, contabilidad y exportaciones reales             | No puede definirse correctamente la clave de snapshot ni la conciliación por ubicación     |
| ADR-Q-005 | ¿Qué tipos de operación abierta podrán transferirse a la futura ANKLO S.A.S. y cuáles permanecerán atribuidos a Distripernos?                           | Transición organizacional                    | Christian, contabilidad y asesoría legal/contractual    | No puede definirse el patrón de transición temporal completo                               |
| ADR-Q-006 | ¿Qué efectos de compra, venta, compensación o préstamo con Servipernos deben registrarse obligatoriamente en Migo?                                      | Inventario externo, préstamos y coexistencia | Contratos, contabilidad y Christian                     | El ADR no puede cerrar la relación entre evento operativo y documento oficial              |

Estas preguntas no reabren decisiones ya tomadas: `BusinessGroup` seguirá siendo el límite superior de tenencia; el acceso seguirá siendo explícito; Migo seguirá siendo oficial durante 2026 para los procesos definidos; ANKLO no será sustituida retroactivamente.

## B. Preguntas que bloquean el modelo lógico

| ID        | Pregunta                                                                                                                           | Entidades/contratos afectados                             | Evidencia necesaria                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| LOG-Q-001 | ¿Cuál es la estructura exacta de cada XLS de Migo, incluidos encabezados, hojas, tipos, formatos, zonas horarias y separadores?    | `InventoryImportBatch`, parser y contrato externo         | Muestras originales anonimizadas de cada exportación permitida       |
| LOG-Q-002 | ¿Qué identificadores estables ofrece Migo para producto, almacén, lote, documento, línea y tercero?                                | Mapeos externos e idempotencia                            | Diccionario/exportación real y validación con usuarios de Migo       |
| LOG-Q-003 | ¿Cómo representa Migo correcciones, anulaciones, reemplazos y documentos reemitidos?                                               | Importaciones, snapshots, tareas y reconciliación         | Casos históricos o documentación del proveedor                       |
| LOG-Q-004 | ¿Qué campos podrán importarse para factura, nota de crédito, guía, compra, devolución y ajuste?                                    | Referencias externas y `ExternalErpTask`                  | Exportaciones autorizadas y matriz contable                          |
| LOG-Q-005 | ¿Cada XLS representa saldo a una fecha, movimientos de un periodo o ambos, y qué fecha tiene autoridad?                            | `StockSnapshot` y movimientos importados                  | Ejemplos de cierre y explicación del proceso Migo                    |
| LOG-Q-006 | ¿Qué combinación identifica de forma única un lote de importación y una fila para impedir duplicados sin depender solo del hash?   | Idempotencia de importaciones                             | Identificadores Migo, periodo, tipo y reglas de reexportación        |
| LOG-Q-007 | ¿Cuáles son fecha efectiva, razón social, identificador legal y relaciones societarias de la futura ANKLO S.A.S.?                  | `LegalEntity`, vigencias y numeraciones                   | Documentos constitutivos y fiscales cuando existan                   |
| LOG-Q-008 | ¿Cómo se tratarán pedidos, reservas, préstamos, obras, personal y cortes abiertos durante la transición a ANKLO S.A.S.?            | Referencias temporales y transferencia de operaciones     | Decisión caso por caso aprobada por negocio y autoridades aplicables |
| LOG-Q-009 | ¿Cuál es la documentación contractual y comercial vigente con Servipernos?                                                         | Contraparte, propiedad, almacén externo y modalidad       | Contrato, acuerdos, órdenes o soportes reales                        |
| LOG-Q-010 | ¿Qué formato, actor y vigencia tendrá una reserva o confirmación de disponibilidad de Servipernos?                                 | Observación, confirmación, reserva y vencimiento externos | Formato acordado con la contraparte                                  |
| LOG-Q-011 | ¿Cuál es el catálogo real de productos, unidades, equivalencias, lotes y especificaciones necesarias para disponibilidad y corte?  | `Product`, mapeos, piezas y movimientos                   | Catálogo aprobado y muestras de operación                            |
| LOG-Q-012 | ¿Qué precisión, reglas de conversión y redondeo se usarán para cantidades, longitudes, costos y precios?                           | Valores de dominio y contratos                            | Política comercial/operativa aprobada                                |
| LOG-Q-013 | ¿Qué tipos de almacén existen: propio, obra, tránsito, cuarentena, externo, custodia o virtual, y qué movimientos admite cada uno? | `Warehouse`, `ExternalWarehouse`, movimientos y ATP       | Proceso real de bodega y propiedad                                   |
| LOG-Q-014 | ¿Qué constituye una diferencia material para exigir cierre por dueño?                                                              | Reconciliación y autorización                             | Política de materialidad aprobada                                    |
| LOG-Q-015 | ¿Qué datos y documentos son obligatorios para declarar préstamo, compra, venta, compensación o liquidación mixta?                  | `InventoryLoan` y `LoanSettlement`                        | Contabilidad, contratos y casos reales                               |
| LOG-Q-016 | ¿Cuál es el ancho de corte por máquina/proceso y cómo se registra su vigencia?                                                     | Especificación y patrón de corte                          | Medición/procedimiento aprobado del taller                           |
| LOG-Q-017 | ¿Qué pérdidas iniciales, finales o de preparación aplican por proceso?                                                             | Optimización, merma y conciliación plan-real              | Datos de taller validados                                            |
| LOG-Q-018 | ¿Cuál es la longitud mínima de remanente reutilizable por producto/especificación?                                                 | `Remnant` y reglas del optimizador                        | Política de taller y análisis económico/técnico                      |
| LOG-Q-019 | ¿Qué atributos hacen compatibles una barra, pieza o remanente con una solicitud de corte?                                          | Producto base, pieza, remanente y plan                    | Catálogo, trazabilidad de material y reglas de taller                |
| LOG-Q-020 | ¿Qué estados de cuarentena y bloqueo afectan ATP y quién puede liberarlos?                                                         | Movimientos, ATP y autorizaciones                         | Calidad, bodega y matriz de permisos                                 |
| LOG-Q-021 | ¿Qué tolerancias dimensionales y de balance se aprobarán por familia o proceso de corte?                                           | Plan, ejecución, recepción y clasificación de pérdidas    | Procedimiento, casos reales y autoridad operativa/técnica            |
| LOG-Q-022 | ¿Qué límites y criterios de criticidad permiten aprobación operativa de merma extraordinaria?                                      | `ExtraordinaryLoss`, segregación y escalamiento           | Política aprobada sin inferir montos ni porcentajes                  |
| LOG-Q-023 | ¿Qué documento comercial real emite PROMED por el servicio y qué referencias mínimas lo relacionan con la ejecución?               | `CutService`, costo real y conciliación                   | Muestra autorizada y validación comercial/contable                   |
| LOG-Q-024 | ¿Qué eventos de manufactura y corte deben producir una tarea de registro o conciliación con Migo?                                  | `ReconciliationTask`, movimientos y costos                | Matriz proceso–evento–documento–autoridad revisada por contabilidad  |
| LOG-Q-025 | ¿Qué claves, formatos y semántica permiten conciliar entradas, salidas, merma, residuo y servicio de corte con Migo?               | Correlación e idempotencia de conciliación                | Exportaciones, identificadores y casos de corrección reales          |
| LOG-Q-026 | ¿Qué política futura permitirá incorporar costos indirectos y con qué autoridad y vigencia?                                        | Versiones posteriores de `CostEstimate` y `ActualCost`    | Política de costos y validación contable                             |
| LOG-Q-027 | ¿Qué casos reales controlados y resultados esperados validarán consumo previsto, balance y costos básicos?                         | Pruebas de diseño del primer incremento                   | Casos anonimizados, mediciones y revisión de taller/inventario       |
| LOG-Q-028 | ¿Qué usuarios concretos recibirán roles de solicitud, planificación, aprobación, ejecución, recepción, inventario y dirección?     | Autorización y segregación de manufactura                 | Matriz RACI/capacidades aprobada                                     |

## C. Preguntas que bloquean la implementación

| ID        | Pregunta                                                                                                                     | Corte vertical afectado           | Criterio mínimo para desbloquear                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| IMP-Q-001 | ¿Qué muestra XLS se usará como fixture inicial y quién certifica que fue anonimizada y permitida?                            | Importación Migo                  | Archivo controlado, permiso de uso y resultado esperado                   |
| IMP-Q-002 | ¿Qué hacer cuando el snapshot Migo esté ausente o supere su vigencia permitida?                                              | ATP y cotización                  | Política de degradación: bloquear, ocultar o mostrar advertencia aprobada |
| IMP-Q-003 | ¿Qué nivel de precisión de stock verá cada rol y contexto?                                                                   | Autorización y consulta comercial | Matriz rol–entidad–unidad–precisión aprobada                              |
| IMP-Q-004 | ¿Qué proveedor de identidad y política de cuentas/MFA se utilizarán?                                                         | Membresía, contexto y delegación  | Proveedor, flujo de alta/baja y roles críticos aprobados                  |
| IMP-Q-005 | ¿Qué roles reales corresponden a dueño, superadministrador, jefe de ventas, supervisor, bodeguero y operador de integración? | Autorización y segregación        | Matriz RACI y nombres de permisos verificables                            |
| IMP-Q-006 | ¿Qué reglas iniciales de margen, recargo, tablas, valor manual, redondeo y vigencia se cargarán?                             | Pricing y cotización              | Ejemplos aprobados con resultados esperados                               |
| IMP-Q-007 | ¿Qué evento constituye aceptación de cotización y qué evidencia debe conservarse?                                            | Cotización a pedido               | Evento, actor, canal, versión y evidencia aprobados                       |
| IMP-Q-008 | ¿Qué evento confirma una salida o aprueba un ingreso pendiente de Migo para afectar ATP?                                     | Inventario operativo              | Estados, autoridad y pruebas de transición aprobados                      |
| IMP-Q-009 | ¿Qué campos mínimos debe llevar una tarea Migo por tipo documental y qué evita su duplicación?                               | Cola Migo                         | Contrato por tipo, clave idempotente y ejemplo conciliado                 |
| IMP-Q-010 | ¿Qué coincidencia se considera inequívoca para conciliación automática?                                                      | Reconciliación                    | Claves, tolerancias y casos negativos aprobados                           |
| IMP-Q-011 | ¿Cómo se registra y revoca una excepción del dueño a la segregación de ajustes?                                              | Ajustes sensibles                 | Flujo, motivo obligatorio, vigencia y evento de auditoría                 |
| IMP-Q-012 | ¿Qué canal y evidencia se aceptarán inicialmente para confirmar stock de Servipernos?                                        | Inventario externo                | Formato, actor, caducidad y ejemplo verificable                           |
| IMP-Q-013 | ¿Qué objetivo y desempate usará inicialmente el optimizador: costo, desperdicio, remanentes, barras o patrones?              | Corte                             | Prioridad/ponderación, ejemplos y solución esperada                       |
| IMP-Q-014 | ¿Qué dispositivos, navegadores y escenarios offline debe soportar la interfaz móvil inicial?                                 | Operación de técnicos             | Matriz de dispositivos y tareas críticas probadas                         |
| IMP-Q-015 | ¿Qué datos personales y técnicos puede mostrar cada informe/exportación consolidada?                                         | Reportes y seguridad              | Clasificación, propósito, permiso y audiencia aprobados                   |
| IMP-Q-016 | ¿Manufactura y corte formarán parte del MVP general o ingresarán como incremento posterior?                                  | Alcance y secuencia del producto  | Decisión documentada de Israel tras revisar ADR 0009 y casos reales       |

## D. Supuestos temporales operables

| ID      | Supuesto                                                                                             | Alcance permitido                                       | Riesgo                                              | Criterio de revisión                                                |
| ------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| SUP-001 | Migo no ofrece inicialmente API utilizable, webhooks, reserva externa ni escritura automática        | Diseñar integración XLS/manual y puertos sustituibles   | Trabajo manual y consistencia eventual              | Revisar al obtener documentación o acceso técnico de Migo           |
| SUP-002 | Las importaciones autorizadas se originarán inicialmente en archivos XLS conservados como originales | Diseño de lotes y auditoría                             | Formatos múltiples o archivos regenerados           | Revisar con las primeras muestras reales                            |
| SUP-003 | No existe todavía una integración utilizable verificada con Servipernos                              | Mantener el modo híbrido aprobado detrás de adaptadores | Trabajo manual e información potencialmente vencida | Revisar al obtener documentación o acceso técnico de la contraparte |
| SUP-004 | ANKLO seguirá siendo unidad operativa de Distripernos hasta que exista evidencia legal de la S.A.S.  | Atribución de nuevas operaciones                        | Constitución o vigencia no comunicada               | Revisar al recibir documentos constitutivos/fiscales                |

Un supuesto temporal no autoriza datos ficticios como si fueran reales, ni permite saltar validación, auditoría o segregación de funciones.

## E. Decisiones configurables que no bloquean

Estas decisiones ya están adoptadas como capacidades configurables. No deben mantenerse como preguntas arquitectónicas; solo requieren valores iniciales antes del corte vertical correspondiente.

| ID      | Capacidad decidida                           | Configuración pendiente                                         | Responsable esperado                       |
| ------- | -------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| CFG-001 | Visibilidad de cantidades de stock           | Exacta, bandas, redondeada u oculta por rol/contexto            | Superadministrador según política aprobada |
| CFG-002 | Escenarios P1, P2, P3 y P4                   | Nombre, contenido, orden, vigencia y disponibilidad por entidad | Dueño/administrador autorizado             |
| CFG-003 | Métodos de precio                            | Margen, recargo, tabla, manual o combinación                    | Dueño o delegado temporal                  |
| CFG-004 | Aplicación de precio ante faltante           | Toda la línea por defecto; solo faltante por decisión del dueño | Dueño                                      |
| CFG-005 | Plazos de reserva                            | Valores, vigencia, tipos y excepciones                          | Dueño/administrador autorizado             |
| CFG-006 | Prioridad de consumo de remanentes           | Orden y condiciones de uso                                      | Taller/autoridad de inventario             |
| CFG-007 | Objetivo del optimizador                     | Pesos y desempates entre costo, merma, barras y patrones        | Dueño/taller autorizado                    |
| CFG-008 | Vigencia de observación/confirmación externa | Duración por fuente, producto o modalidad                       | Autoridad de abastecimiento                |
| CFG-009 | Materialidad de diferencias                  | Umbrales por cantidad, valor, producto y contexto               | Dueño con validación contable/operativa    |
| CFG-010 | Permisos de costos                           | Visibilidad para dueño y supervisor por entidad/contexto        | Dueño/superadministrador                   |
| CFG-011 | Delegación de aprobación de precios          | Receptor, alcance, vigencia, límites y revocación               | Dueño                                      |
| CFG-012 | Presentación administrativa                  | Densidad, columnas, filtros y acciones guardadas                | Producto/usuarios autorizados              |
| CFG-013 | Modalidad y proveedor de corte               | `INTERNAL`/`EXTERNAL`, proveedor, alcance y vigencia            | Autoridad operativa por contexto           |
| CFG-014 | Identificación física híbrida                | Familias con identidad individual o lote homogéneo              | Inventario/calidad según política aprobada |
| CFG-015 | Umbral de remanente                          | 2 pulgadas como política temporal inicial; futuras versiones    | Autoridad operativa/inventario             |
| CFG-016 | Pérdidas normales y límites extraordinarios  | Componentes aprobados, tolerancia, límite y escalamiento        | Operación, inventario y dirección          |
| CFG-017 | Componentes de costo habilitados             | Material y servicio en primer alcance; extensiones posteriores  | Dirección con validación contable          |

## F. Criterio de cierre de preguntas

Para cerrar una pregunta se debe registrar decisión, autoridad, evidencia, fecha de vigencia, excepciones y artefactos afectados en una nueva versión del [registro de decisiones](./Registro_Decisiones_Producto_v2.0.md). Una respuesta informal o un valor observado no se transforma automáticamente en política general.

## G. Cierres documentales de manufactura y corte

Las decisiones funcionales de Israel del 16 de julio de 2026 cierran los siguientes asuntos de alcance, sin resolver los datos técnicos, contables o contractuales residuales:

| Asunto previamente abierto o ausente                 | Resolución funcional                                                                                    | Decisión               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------- |
| Naturaleza del corte y quién puede ejecutarlo        | Transformación física independiente del ejecutor; modalidad `INTERNAL` o `EXTERNAL` por orden/ejecución | `PROD-028`             |
| Corte como proceso, servicio o bien                  | Proceso, `CutService` y `ManufacturedProduct` son conceptos distintos                                   | `PROD-029`             |
| Papel de PROMED                                      | Proveedor externo que ejecuta servicio sin adquirir barras ni gobernar inventario                       | `PROD-030`             |
| Propiedad y custodia actuales                        | Distripernos conserva propiedad y control físico; PROMED recibe custodia operacional temporal           | `PROD-031`             |
| Situación actual y capacidad futura de ANKLO         | ANKLO actual no es empresa contable independiente; una futura entidad podrá ser propietaria/solicitante | `PROD-032`, `PROD-033` |
| Separación de responsabilidades                      | Solicitante, planificador, aprobador, ejecutor y receptor son capacidades diferentes                    | `PROD-034`             |
| Estrategia de identificación                         | Identificación híbrida individual/lote sin pérdida de genealogía                                        | `PROD-035`             |
| Valor inicial de candidato a remanente               | 2 pulgadas como política temporal configurable, no aptitud automática                                   | `PROD-036`             |
| Clasificación de salidas y aprobación extraordinaria | Producto, remanente, merma normal/extraordinaria y residuo separados; escalamiento por roles            | `PROD-037`, `PROD-038` |
| Alcance inicial de costos                            | Solo material y servicio, estimados y reales; Migo conserva autoridad oficial                           | `PROD-039`             |
| Forma del primer incremento futuro                   | Planificación y ejecución manual con cálculo determinista; sin optimizador                              | `PROD-040`             |
| Configuración frente a integridad y estados          | Políticas versionables sin romper invariantes; estados conceptuales revisables                          | `PROD-041`, `PROD-042` |

`LOG-Q-018` queda resuelta únicamente para la política temporal inicial de 2 pulgadas. Permanece abierta para umbrales futuros por producto o especificación y para la validación de compatibilidad y aptitud. `IMP-Q-013` continúa abierta porque el optimizador automático no forma parte del primer incremento manual aprobado.
