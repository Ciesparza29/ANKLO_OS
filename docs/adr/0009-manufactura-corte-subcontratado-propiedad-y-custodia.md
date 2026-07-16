# ADR 0009: manufactura, corte subcontratado, propiedad y custodia

- **Identificador:** ADR-0009
- **Estado:** PROPUESTO
- **Fecha:** 16 de julio de 2026
- **Director funcional:** Israel
- **Aprobación funcional de las decisiones de base:** Israel

> Este ADR formaliza decisiones funcionales aprobadas por Israel y propone su organización arquitectónica. No constituye validación jurídica, contractual, contable, tributaria, ambiental ni técnica definitiva, no aprueba parámetros productivos y no autoriza implementación.

## Contexto

Distripernos transforma barras y espárragos en piezas o productos terminados mediante operaciones de corte. La transformación puede ejecutarse internamente o por un proveedor externo sin que cambie la naturaleza física del proceso.

En la operación actual, PROMED es una empresa externa que vende el servicio de corte. Distripernos conserva la propiedad y el control físico del inventario; PROMED recibe temporalmente material para ejecutarlo y devuelve o entrega los productos fabricados, remanentes y resultados de merma. Ambas empresas comparten actualmente el mismo espacio físico o espacios contiguos, por lo que una transición de custodia no implica necesariamente transporte.

ANKLO es actualmente el brazo operativo de servicios de instalación administrados o vendidos por Distripernos. No se presenta como entidad contable independiente. La arquitectura debe permitir que una futura ANKLO independiente sea propietaria y solicitante aunque Distripernos continúe como custodio físico, sin reatribuir operaciones actuales ni implementar todavía contabilidad multiempresa.

## Problema

Si corte se modela como un único producto que alterna entre bien, servicio y proceso, el sistema puede crear inventario sobre un servicio, perder genealogía, confundir propiedad con custodia o atribuir a PROMED autoridad de inventario. Si aprobar un plan cambia existencias, se crea stock ficticio. Si una ejecución externa se trata como transporte obligatorio, se documenta un hecho inexistente. Si estimaciones, costos oficiales y parámetros desconocidos se mezclan, la conciliación comercial y contable deja de ser explicable.

## Alcance

- transformación física de materia prima en productos, remanentes, merma y residuos;
- modalidad `INTERNAL` o `EXTERNAL` por orden o ejecución;
- PROMED como proveedor externo actual de servicio de corte;
- separación entre proceso, servicio comercial y producto fabricado;
- propiedad, custodia, solicitante, planificador, aprobador, ejecutor y receptor;
- entrega a ejecución y recepción sin presumir transporte;
- identificación individual o por lote homogéneo;
- clases de salida y balance físico;
- costos operativos básicos estimados y reales;
- estados conceptuales de solicitud, plan y ejecución;
- auditoría, corrección y futura conciliación con Migo;
- capacidad futura de ANKLO independiente sin reatribución histórica.

## Fuera de alcance

- diseñar tablas, Prisma, migraciones, contratos TypeScript, endpoints o interfaces;
- seleccionar o desarrollar un algoritmo de optimización;
- inventar kerf, tolerancias, pérdidas adicionales, tarifas, tiempos o máquinas;
- implementar contabilidad o facturación multiempresa;
- emitir o transmitir documentos a Migo;
- conciliación automática con Migo;
- definir tratamiento jurídico, contable, tributario o ambiental;
- costos indirectos, depreciación, energía, transporte, mano de obra indirecta, distribución contable, impuestos o costeo estatutario;
- modificar requisitos técnicos de anclajes en obra.

## Fuerzas y criterios de decisión

- balance físico reconstruible;
- propiedad y custodia independientes y vigentes;
- separación entre planificación y ejecución real;
- proceso independiente del ejecutor;
- servicio sin inventario físico;
- genealogía de productos y remanentes;
- costos operativos comparables sin duplicar contabilidad;
- operación posible en instalación compartida;
- configuración versionada sin ruptura de invariantes;
- evolución a una futura entidad ANKLO sin reescribir historia.

## Decisión propuesta

### Transformación y modalidad

El corte se representa como transformación física:

```text
materia prima
  -> productos o piezas terminadas
   + remanentes reutilizables
   + merma normal o extraordinaria
   + residuos recuperables cuando corresponda
```

Cada solicitud u operación declara modalidad `INTERNAL` o `EXTERNAL`. `INTERNAL` significa que una unidad autorizada de la organización ejecuta; `EXTERNAL`, que un proveedor o subcontratista ejecuta. La modalidad se selecciona por orden o ejecución, conserva actor, contexto, vigencia y evidencia y no cambia directamente después del cierre.

### Proceso, servicio y producto

- **Proceso de corte:** transformación física y trazabilidad; no es por sí mismo un producto comercial.
- **`CutService`:** concepto comercial comprado o vendido por ejecutar el proceso; no mantiene existencias físicas.
- **`ManufacturedProduct`:** resultado físico, como espárrago, segmento, pieza especial, producto terminado o lote homogéneo; puede mantener inventario operativo, costo y genealogía.

Una `CutExecution` puede consumir barras, producir bienes, remanentes y merma y relacionarse con un `CutService` comprado. Esa relación no fusiona proceso, servicio y producto.

### PROMED y ejecución externa actual

PROMED se representa como `CutServiceProvider` externo. Ejecuta materialmente el corte, pero no compra las barras, no adquiere la propiedad, no gobierna el inventario de Distripernos y no se convierte en responsable del stock contable.

La entrega a ejecución y la recepción son eventos operativos aun cuando no exista traslado entre direcciones. En una instalación compartida o contigua, `CustodyEvent` puede registrar cambio de estado, área o custodia operacional sin afirmar transporte. No se crea ruta, vehículo, guía ni movimiento físico inexistente.

### Propiedad, custodia y responsabilidades

`OwnershipContext` identifica propietario y vigencia sin afirmar por sí solo validez jurídica. `CustodyEvent` conserva quién controla operacionalmente el material, el motivo, el alcance y el momento. Custodia no transfiere propiedad.

Se distinguen:

- propietario;
- custodio de inventario;
- solicitante;
- planificador;
- aprobador;
- ejecutor;
- receptor.

Actualmente Distripernos es propietario, solicitante y responsable del control físico; roles autorizados de Distripernos planifican y aprueban; PROMED ejecuta. Coincidencias futuras entre responsabilidades no se infieren: requieren asignación y autorización explícitas.

### ANKLO actual y futuro

ANKLO actual se conserva como unidad o brazo operativo bajo el contexto organizacional documentado en ADR 0003. No se le atribuyen contabilidad, propiedad o responsabilidad de inventario independientes sin evidencia.

Una futura ANKLO independiente podrá ser propietaria y solicitante, comprar barras a Distripernos, mantener custodia física/logística en Distripernos, contratar corte a PROMED y recibir productos propios. Esta capacidad no crea hoy una entidad, relación intercompañía, documento contable ni transferencia histórica.

### Modelo conceptual mínimo

Los siguientes nombres expresan responsabilidades, no tablas definitivas:

- `CutRequest`: necesidad autorizable de transformar material.
- `CutRequirement`: especificación y cantidad solicitadas desde una fuente aprobada.
- `CutPlan`: versión de planificación sin efecto físico.
- `CutPattern`: distribución propuesta de entradas y salidas.
- `CutPatternLine`: relación propuesta entre pieza candidata, corte y resultado.
- `CutExecution`: hecho operativo interno o externo.
- `CutExecutionInput`: pieza realmente entregada y consumida.
- `CutExecutionOutput`: resultado real clasificado y medido.
- `MaterialPiece`: barra o segmento físico identificable o perteneciente a lote controlado.
- `ManufacturedProduct`: producto físico conforme al requisito.
- `ReusableRemnant`: segmento candidato y aprobado para reutilización.
- `NormalLoss`: pérdida inherente prevista por política aprobada.
- `ExtraordinaryLoss`: pérdida imprevista o fuera de tolerancia.
- `RecoverableWaste`: material no reutilizable como pieza pero recuperable, reciclable o vendible como residuo sujeto a reglas posteriores.
- `CutService`: servicio comercial asociado a la ejecución.
- `CutServiceProvider`: proveedor que ejecuta el servicio.
- `CustodyEvent`: cambio de control operacional, estado o área, con o sin transporte.
- `OwnershipContext`: propietario, entidad y vigencia aplicables.
- `CostEstimate`: material y servicio previstos dentro del alcance aprobado.
- `ActualCost`: material consumido y servicio cobrado dentro del alcance aprobado.
- `ReconciliationTask`: diferencia o efecto pendiente de contraste, incluido Migo cuando corresponda.

`CutRequest` reúne uno o más requisitos. Un plan versionado responde a una solicitud y referencia piezas candidatas. La ejecución puede referenciar un plan aprobado o una autorización excepcional documentada, pero siempre conserva entradas y salidas reales. Cada salida conserva ejecución y origen; el lote homogéneo no elimina genealogía.

### Identificación híbrida

Se usa identidad individual para barras completas asignadas, remanentes, piezas especiales, alto valor, materiales de terceros u otra empresa y trazabilidad individual exigida. Los productos terminados homogéneos pueden agruparse por lote si comparten especificación, longitud, material, norma, acabado, orden, propietario, ejecución y condiciones equivalentes aprobadas.

La política es versionada por organización o familia. Cambiarla no fusiona, divide ni reidentifica silenciosamente inventario histórico.

### Remanentes y umbral temporal

Un segmento de al menos 2 pulgadas puede ser candidato a `ReusableRemnant`. El valor se registra con unidad explícita como política temporal inicial, configurable, versionada, con organización y vigencia. No es constante universal ni declara aptitud automática.

La clasificación final requiere compatibilidad, estado físico, daño, contaminación, longitud, pedido y criterio operativo aprobado. Una excepción requiere aprobación y auditoría. Un segmento que no sea reutilizable se clasifica según la evidencia como merma o residuo; no se mezcla con remanente.

### Clases de salida y aprobación

- `ManufacturedProduct`: cumple el requisito y puede ingresar al inventario operativo.
- `ReusableRemnant`: conserva identidad/lote, longitud, origen, ubicación, estado y compatibilidad.
- `NormalLoss`: incluye kerf real y otras pérdidas inherentes expresamente configuradas y vigentes.
- `ExtraordinaryLoss`: error, corte incorrecto, daño, rechazo, pérdida, diferencia no explicada, retrabajo o incidente.
- `RecoverableWaste`: no se reutiliza como barra o pieza, pero puede tener recuperación posterior.

El supervisor operativo registra y justifica merma extraordinaria; inventario verifica cantidades; un aprobador operativo podrá aprobar dentro de un límite futuro; dirección aprueba por encima o ante casos críticos. Hasta aprobar límites, toda merma extraordinaria requiere rol de dirección. No se fijan montos ni porcentajes.

### Costos básicos

`CostEstimate` conserva solo:

- valor estimado del material a consumir;
- precio estimado o cotizado del servicio de corte.

`ActualCost` conserva solo:

- valor del material realmente consumido;
- valor real cobrado por el servicio.

La comparación plan–real es operativa y conciliable. Migo sigue siendo en 2026 autoridad de los registros contables y tributarios aplicables. ANKLO-OS no presenta sus costos operativos como costo contable oficial.

### Primer incremento futuro

El primer incremento será manual y controlado: solicitud, selección de piezas, patrón manual, kerf de configuración aprobada, cálculo determinista del consumo previsto, resultados previstos, entrega, modalidad, recepción, resultados reales, comparación, costos básicos, auditoría y tareas pendientes de conciliación.

No incluye optimizador automático, IA para patrones, transmisión Migo, contabilidad, facturación, conciliación automática, costos indirectos ni conformidad automatizada. ADR 0007 conserva la planificación y futura optimización.

### Estados conceptuales revisables

Solicitud de corte:

`BORRADOR -> PENDIENTE_REVISION -> APROBADA`

Salidas controladas: `CANCELADA`.

Plan de corte:

`BORRADOR -> PENDIENTE_APROBACION -> APROBADO`

Salidas controladas: `RECHAZADO`, `SUSTITUIDO`.

Ejecución:

`PREPARADA -> MATERIAL_ASIGNADO -> EN_EJECUCION -> PENDIENTE_RECEPCION -> RECIBIDA -> PENDIENTE_CONCILIACION -> CERRADA`

Salidas o estados controlados: `BLOQUEADA`, `CANCELADA`.

Estos nombres son propuesta derivada de decisiones aprobadas. Sus transiciones, reaperturas, cancelaciones y autoridades requieren casos reales antes de implementarse. Aprobar solicitud o plan no produce inventario; recibir y confirmar la ejecución puede producir movimientos operativos.

## Invariantes

- Una pieza no se consume dos veces.
- Un plan no crea ni consume stock físico.
- Aprobar un plan no equivale a ejecutar.
- Solo una ejecución confirmada produce movimientos operativos y salidas reales.
- Toda salida conserva relación con ejecución y material de origen.
- Todo remanente conserva origen, identidad/lote, longitud y estado.
- Producto, remanente, merma y residuo son clasificaciones distintas.
- La merma no se oculta mediante ajuste genérico.
- Propiedad y custodia no se infieren una de otra ni se sobrescriben históricamente.
- Una ejecución cerrada no se edita directamente.
- Una corrección usa reverso, revisión o movimiento compensatorio relacionado.
- La modalidad cerrada no cambia retroactivamente.
- Un servicio no mantiene inventario físico.
- Una cotización aceptada no se recalcula silenciosamente.
- El tipo histórico de un producto con movimientos no cambia libremente.
- Migo conserva la autoridad oficial definida para 2026.
- Inventario de otra empresa o tercero no se suma automáticamente al ATP propio.
- El corte comercial no cambia requisitos técnicos de anclajes de obra.

## Límites de responsabilidad

- ADR 0003 aporta entidad, unidad, contexto y futuras vigencias.
- ADR 0004 gobierna tareas y conciliación con Migo.
- ADR 0005 gobierna movimientos, perspectivas, ATP y reversos.
- ADR 0006 gobierna cotización, recotización, precio y servicio comprado.
- ADR 0007 gobierna piezas, patrones, genealogía, planificación y futura optimización.
- ADR 0008 gobierna inventario externo como fuente de abastecimiento; PROMED recibe material propio para transformarlo y no se fusiona con esa disponibilidad externa.
- Inventario autoriza y registra movimientos; manufactura no edita saldos.
- Contabilidad determina efectos oficiales; el ADR no los infiere.
- Calidad/operación determinan conformidad física según criterios aprobados.

## Alternativas consideradas

### Un único producto “corte”

Rechazada porque mezcla proceso, servicio e inventario físico.

### Tratar material entregado a PROMED como vendido

Rechazada porque PROMED no adquiere propiedad en la operación documentada.

### Exigir transporte para toda entrega externa

Rechazada porque la instalación compartida puede producir cambio de custodia sin traslado.

### Crear stock al aprobar el plan

Rechazada porque el plan es intención y puede ejecutarse diferente.

### Hacer que PROMED diseñe y apruebe siempre el patrón

Rechazada porque ejecutar no concede automáticamente planificación o aprobación.

### Incluir costeo completo desde el primer alcance

Rechazada por falta de política y riesgo de duplicar o contradecir Migo.

## Consecuencias positivas

- transformación interna o externa bajo invariantes comunes;
- PROMED representado sin falsa propiedad;
- balance y genealogía explicables;
- instalación compartida sin transporte ficticio;
- separación de servicio y existencias;
- preparación para propiedad futura de ANKLO;
- costos básicos comparables y conciliables;
- base manual verificable antes del optimizador.

## Consecuencias negativas

- más conceptos y estados que una orden simple;
- disciplina de medición, recepción y clasificación;
- políticas versionadas y matriz de autoridad pendientes;
- trabajo manual mientras no exista integración;
- conciliaciones abiertas hasta contar con evidencia Migo.

## Riesgos

- kerf o tolerancias supuestos;
- doble consumo de material;
- custodia presentada como propiedad;
- lote homogéneo usado para ocultar genealogía;
- merma extraordinaria clasificada como normal;
- servicio registrado como existencia;
- costos operativos presentados como oficiales;
- documento PROMED o evento Migo inventado;
- ANKLO futura presentada como entidad actual;
- recálculo de cotización aceptada.

## Preguntas abiertas

- ¿Qué atributos exactos determinan compatibilidad?
- ¿Cuáles son unidades maestras, equivalencias y precisiones?
- ¿Cuál es el kerf real por máquina o proceso y su vigencia?
- ¿Qué tolerancias y pérdidas normales adicionales están aprobadas?
- ¿Qué límites y criticidad gobiernan merma extraordinaria?
- ¿Qué usuarios reciben los roles conceptuales?
- ¿Qué documento comercial real emite PROMED y cómo se relaciona?
- ¿Qué eventos exactos requieren tarea y conciliación Migo?
- ¿Qué claves, formatos y semántica gobiernan la conciliación?
- ¿Qué política futura incorporará costos indirectos?
- ¿Qué casos reales y resultados esperados validarán el cálculo?
- ¿Manufactura/corte ingresará finalmente al MVP general?

## Decisiones configurables

- modalidad interna o externa;
- proveedor, solicitante, propietario y custodio;
- roles de planificación, aprobación, ejecución y recepción;
- estrategia de identificación por familia;
- umbral de remanente y excepciones;
- pérdidas normales aprobadas;
- componentes de costo habilitados dentro del alcance aprobado;
- límites de aprobación;
- vigencia de políticas;
- tarifa o cotización del servicio.

Ninguna configuración elimina las invariantes de balance, genealogía, historia, autoridad Migo, inmutabilidad o aislamiento de ATP.

## Impacto de seguridad y auditoría

- autorización por entidad, unidad, rol y acción;
- auditoría de solicitud, plan, aprobación, asignación, custodia, ejecución, recepción, clasificación, costo y conciliación;
- transacción breve para impedir doble consumo;
- protección de costos y documentos comerciales;
- segregación en merma extraordinaria;
- preservación de plan y ejecución real;
- idempotencia de recepción, cierre y tareas;
- pruebas negativas entre propietarios, custodios y empresas.

## Estrategia de transición

1. Ratificar catálogo, unidades y compatibilidades.
2. Medir kerf y pérdidas por proceso.
3. Aprobar matriz de roles, tolerancias y límites.
4. Recopilar casos reales anonimizados y resultados esperados.
5. Validar manualmente solicitud, plan, custodia, ejecución, recepción y balance.
6. Definir contratos de movimientos con ADR 0005.
7. Definir recotización y servicio con ADR 0006.
8. Definir tareas y evidencia Migo con ADR 0004.
9. Evaluar optimización solo después conforme a ADR 0007.

## Condiciones para pasar a ACEPTADO

- Israel revisa la organización conceptual y confirma que refleja sus decisiones funcionales.
- Distripernos y responsables operativos ratifican el flujo real y las responsabilidades dentro de su competencia.
- La relación comercial y de custodia con PROMED cuenta con evidencia suficiente, sin atribuir efectos no documentados.
- Contabilidad valida qué costos y eventos deben registrarse o conciliarse en Migo.
- Se aprueban unidades, compatibilidades, kerf, tolerancias y pérdidas aplicables.
- Se aprueba una matriz de roles y límites de merma extraordinaria.
- Se validan casos de plan sin stock, ejecución balanceada, custodia sin transporte, lote con genealogía, remanente, merma normal/extraordinaria, costo estimado/real y corrección por reverso.
- Se decide inclusión o exclusión del MVP general.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-028`–`PROD-042`.
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md).
- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md).
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md).
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md).
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md).
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md).
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md).
- [Manual Maestro v1.1](../../ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md), para la separación respecto de requisitos técnicos de obra.

## Relaciones con otros ADR

- Depende de ADR 0003–0006.
- Complementa ADR 0007 sin sustituir planificación, patrones, piezas o futura optimización.
- Usa ADR 0008 solo cuando el material pertenece a otra empresa o tercero; PROMED actual no es propietario del material procesado.
- No modifica el estado propuesto de ningún ADR ni autoriza implementación.
