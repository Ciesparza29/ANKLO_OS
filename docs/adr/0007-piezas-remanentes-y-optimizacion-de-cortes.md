# ADR 0007: piezas, remanentes y optimización de cortes

- **Identificador:** ADR-0007
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

Distripernos comercializa barras o espárragos que pueden cortarse en longitudes requeridas. ANKLO-OS debe planificar cortes, consumir barras y remanentes, registrar piezas resultantes y explicar la merma sin crear un producto permanente por cada corte ocasional.

La planificación debe considerar restricciones reales del taller, pero todavía no se han aprobado catálogo, ancho de corte, pérdidas, tolerancias, costos, tiempos, prioridades ni algoritmo definitivo. Existe una política temporal inicial de 2 pulgadas para que un segmento sea candidato a remanente reutilizable; no declara aptitud automática ni sustituye umbrales futuros por familia. El dominio debe incorporar parámetros versionados sin inventarlos.

El [ADR 0009](0009-manufactura-corte-subcontratado-propiedad-y-custodia.md) gobierna modalidad interna/externa, PROMED, propiedad, custodia, servicio comprado, ejecución, clases de salida y costos básicos. Este ADR conserva piezas, segmentos, genealogía, patrones, planificación y futura optimización.

Este corte comercial no puede alterar requisitos técnicos de anclajes estructurales en obra. Longitud comercial y pieza física no sustituyen plano, diseño, especificación, evaluación o MPII.

## Problema

Tratar cada longitud como SKU permanente infla el catálogo y pierde la relación material entre barra, pieza, remanente y merma. Permitir que un plan modifique inventario antes de ejecutarse crea stock ficticio. Codificar un único algoritmo o parámetros supuestos vuelve irreproducibles los resultados y puede optimizar con datos falsos.

También debe evitarse que una decisión de corte de taller se propague como cambio de longitud, embebido u otra especificación técnica de una instalación en obra.

## Alcance

- Producto base y barra completa.
- `MaterialPiece` y `PieceSpecification`.
- Producto fabricado, remanente reutilizable, merma normal, merma extraordinaria y residuo recuperable.
- `CutRequirement`.
- `CutPlan` y `CutPattern`.
- `CutExecution`, conforme al ADR 0009.
- Plan propuesto, aprobación y ejecución real.
- Diferencias plan–ejecución.
- Trazabilidad de pieza origen y piezas resultantes.
- Longitud, unidad, ancho de corte, pérdidas y remanente mínimo como parámetros versionables.
- Prioridad de consumo de remanentes.
- Costo, desperdicio, número de barras y patrones como objetivos/medidas.
- Algoritmo determinista e intercambiable.
- Reproducibilidad y versión de parámetros.
- Movimientos compatibles con ADR 0005.

## Fuera de alcance

- Definir valores reales de kerf/ancho de corte, pérdidas o tolerancias.
- Definir umbrales definitivos de remanente por producto o especificación, costos de máquina, tiempos o prioridades exactas.
- Seleccionar el algoritmo definitivo.
- Crear productos, modelos Prisma, migraciones o código de optimización.
- Modificar requisitos técnicos de anclajes en obra.
- Diseñar mantenimiento de máquinas o seguridad del taller.
- Definir pricing completo; corresponde al ADR 0006.
- Definir propiedad externa o préstamos; corresponde al ADR 0008.

## Fuerzas y criterios de decisión

- Trazabilidad física de transformación.
- Catálogo comercial estable.
- Separación entre planificación y ejecución.
- Balance de longitudes y cantidades.
- Reproducibilidad del resultado.
- Parámetros versionados y explícitos.
- Algoritmo sustituible sin cambiar entidades del dominio.
- Consumo controlado de stock/remanentes disponibles.
- Visibilidad de merma y diferencias reales.
- Separación estricta de especificaciones técnicas de obra.

## Decisión propuesta

### Producto base y piezas

El producto base representa la identidad comercial/material gobernada por catálogo. Una barra completa y cada corte físico se representan como `MaterialPiece` relacionadas con ese producto base. `PieceSpecification` describe las características necesarias para compatibilidad y uso, pero sus atributos concretos se definirán con el catálogo real.

`MaterialPiece` conserva identidad o lote gobernado, producto base, especificación aplicable, longitud, unidad, origen, propietario, custodio, ubicación, estado y referencias de trazabilidad. Crear una pieza no crea automáticamente un SKU comercial. La estrategia híbrida del ADR 0009 permite lote homogéneo sin eliminar la genealogía de barras o segmentos de origen.

### Requisitos y planes

`CutRequirement` expresa una demanda de piezas con producto/especificación, longitud y cantidad requeridas, procedente de una cotización, orden o necesidad autorizada.

`CutPlan` conserva entradas, inventario candidato observado, parámetros, objetivo, algoritmo/versión y resultado propuesto. Un `CutPattern` describe cómo una o más barras/remanentes candidatos producirían piezas requeridas y pérdidas previstas. El plan puede estar propuesto, revisado, aprobado, rechazado, superado o cancelado; los estados definitivos se precisarán en PRD.

El plan es una intención. No reserva ni modifica inventario por sí solo salvo que, mediante un caso de uso separado, solicite reservas al ADR 0005. Aprobar un plan tampoco confirma su ejecución.

### Parámetros y objetivos

Una planificación manual determinista podrá considerar inicialmente requisitos, piezas candidatas, patrón elaborado por una persona autorizada, kerf proveniente de configuración aprobada, consumo y salidas previstas. El mismo cálculo con las mismas entradas ordenadas y versión debe ser reproducible sin seleccionar todavía un optimizador.

Un optimizador futuro podrá considerar:

- longitud comercial de barras;
- longitudes disponibles de remanentes;
- cortes y cantidades requeridos;
- ancho de corte;
- pérdidas iniciales, finales o de preparación;
- longitud mínima reutilizable;
- prioridad de consumo de remanentes;
- costo;
- desperdicio;
- cantidad de barras;
- cantidad de patrones.

Cada valor tendrá fuente, unidad, vigencia y versión cuando se apruebe. Los objetivos pueden ser simples o ponderados, pero sus prioridades y desempates son configurables. Este ADR no asigna valores ni elige una función objetivo final.

### Algoritmo determinista e intercambiable

El dominio define un puerto conceptual de planificación que recibe requisitos, piezas candidatas y parámetros versionados y devuelve un plan explicable. El algoritmo concreto puede ser exacto o heurístico. La misma entrada ordenada, los mismos parámetros, configuración y versión deben producir un resultado reproducible conforme al contrato del adaptador. La semilla se conserva únicamente cuando el algoritmo utiliza aleatoriedad; un algoritmo completamente determinista puede no necesitarla.

La IA generativa no será el motor matemático de optimización. Podrá explicar un resultado o detectar incoherencias bajo revisión humana, sin cambiar el plan aprobado.

### Ejecución real

`CutExecution` registra la ejecución de un plan o un corte autorizado fuera de plan. Conserva modalidad, entradas reales, ejecutor/contexto, medidas, productos fabricados, remanentes, merma normal, merma extraordinaria, residuos recuperables, costos básicos y diferencias justificadas conforme al ADR 0009.

Solo la ejecución confirmada genera movimientos del ADR 0005: consume entradas y da de alta o clasifica salidas mediante eventos balanceados. Aprobar el plan, asignar material o entregarlo a custodia operacional no crea productos terminados. Si la ejecución difiere del plan, se preservan ambos; no se reescribe el patrón para que coincida con el resultado.

### Remanentes y merma

Un remanente reutilizable es una pieza con origen, longitud medida, propietario, custodio, ubicación, estado y compatibilidad conservados. Un segmento de al menos 2 pulgadas es únicamente candidato bajo la política temporal inicial, versionada, con unidad y vigencia explícitas. La aptitud final considera compatibilidad, estado, daño, contaminación y requisito; una excepción requiere aprobación auditada.

Las salidas se clasifican como producto fabricado, remanente reutilizable, merma normal, merma extraordinaria o residuo recuperable. La merma normal corresponde a pérdidas inherentes configuradas, incluido el kerf real aprobado; la extraordinaria cubre pérdidas imprevistas o fuera de tolerancia y sigue la aprobación por roles de ADR 0009. Ninguna merma se esconde en un ajuste genérico.

### Reversos

Un error de registro de corte se corrige conforme al ADR 0005 mediante reversos y nuevos movimientos relacionados. No se borra la ejecución ni se modifica retroactivamente la genealogía de piezas.

### Separación respecto de obra

Los requisitos comerciales de corte se validan contra el producto/especificación solicitados. Nunca actualizan automáticamente diámetro, grado, longitud diseñada, embebido, ubicación u otros parámetros técnicos de un anclaje en obra. Una incompatibilidad debe bloquear el flujo y remitir a autoridad técnica.

## Invariantes

- No se crea un SKU permanente por cada corte ocasional.
- Toda pieza mantiene relación con su producto base.
- Una pieza resultante conserva relación con su pieza origen y operación.
- Un plan no modifica inventario hasta que exista ejecución confirmada.
- Aprobar un plan no equivale a ejecutarlo.
- La ejecución produce movimientos y piezas resultantes balanceados.
- Un remanente conserva longitud, origen, ubicación y estado.
- Producto fabricado, remanente, merma normal, merma extraordinaria y residuo recuperable se registran separadamente.
- Las 2 pulgadas son una política temporal configurable y no una constante universal ni una aprobación automática de reutilización.
- La merma se registra de forma explícita y no se oculta en un ajuste genérico.
- El resultado del optimizador es reproducible con la misma entrada ordenada, parámetros, configuración y versión; si el algoritmo usa aleatoriedad, también conserva la semilla.
- Parámetros y objetivo tienen versión.
- El plan original y la ejecución real se conservan por separado.
- Las diferencias plan–real se registran y justifican.
- Los errores se corrigen por reversos, no reescribiendo genealogía.
- Solo se consumen piezas propias, disponibles y autorizadas; inventario externo sigue ADR 0008.
- Las reglas de corte no modifican requisitos técnicos de anclajes estructurales.

## Límites de responsabilidad

- Catálogo define producto base y atributos aprobados; corte no crea catálogo permanente por conveniencia.
- ADR 0005 controla disponibilidad, reservas y movimientos.
- ADR 0006 origina requisitos comerciales y consume resultados/costos autorizados.
- Este dominio planifica y registra transformación física; no factura ni contabiliza.
- ADR 0009 gobierna ejecución interna/externa, PROMED, propiedad, custodia, servicio, costos y estados operativos.
- ADR 0008 conserva propiedad externa; una pieza externa no se consume como propia sin modalidad/entrega controlada.
- Campo y calidad controlan requisitos técnicos de obra; corte no los modifica.
- El adaptador de algoritmo implementa el puerto; el dominio conserva datos, invariantes y trazabilidad.

## Alternativas consideradas

### SKU por cada longitud

Rechazada porque crea proliferación de catálogo, acopla stock físico a combinaciones ocasionales y dificulta rastrear la transformación.

### Actualizar stock al aprobar el plan

Rechazada porque un plan puede no ejecutarse o ejecutarse distinto. Solo la transformación real produce movimientos.

### Registrar solo merma total

Rechazada porque pierde piezas, remanentes, origen y capacidad de conciliar plan–real.

### Algoritmo fijo dentro del dominio

Rechazada porque parámetros y necesidades pueden cambiar y la selección final aún no tiene evidencia.

### IA generativa como optimizador

Rechazada por falta de reproducibilidad matemática y riesgo de inventar restricciones o valores.

### Modificar el plan para reflejar la ejecución

Rechazada porque oculta variaciones y destruye capacidad de aprendizaje y auditoría.

### Reutilizar cualquier sobrante

Rechazada porque faltan umbrales, compatibilidad, estado y trazabilidad aprobados.

## Consecuencias positivas

- Catálogo estable y piezas físicas trazables.
- Balance explicable de barra, cortes, remanente y merma.
- Optimización reproducible y sustituible.
- Diferencias plan–real visibles.
- Consumo prioritario de remanentes configurable.
- Frontera clara con inventario y requisitos técnicos de obra.

## Consecuencias negativas

- Requiere identidad/genealogía de piezas y más eventos.
- La medición real y disciplina de taller afectan la calidad del dato.
- La optimización puede ser costosa computacionalmente según escala.
- Parámetros versionados aumentan gobierno y pruebas.
- Un algoritmo intercambiable exige contrato estable y comparación de resultados.

## Riesgos

- Parámetros supuestos presentados como reales.
- Piezas incompatibles combinadas por catálogo incompleto.
- Doble consumo de una barra/remanente por concurrencia.
- Medidas reales distintas sin conciliación.
- Merma ocultada como ajuste.
- Plan reproducible técnicamente pero basado en snapshot vencido.
- Función objetivo que reduce desperdicio a costa de costo o complejidad no aprobados.
- Propagar una longitud comercial como cambio técnico de obra.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                                                                                   | Impacto                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué atributos hacen compatibles producto, barra, pieza y remanente?                                                       | Define frontera de `PieceSpecification`.                             |
| Evidencia requerida                 | ¿Cuál es el catálogo real y qué unidades/precisiones usa?                                                                  | Bloquea modelo lógico y fixtures.                                    |
| Pregunta bloqueante para aceptación | ¿Qué proceso y autoridad aprueban un plan y validan la ejecución?                                                          | Define estados y segregación mínima.                                 |
| Pregunta de implementación          | ¿Cuál es el ancho de corte por máquina/proceso?                                                                            | Debe medirse y versionarse; no bloquea patrón arquitectónico.        |
| Pregunta de implementación          | ¿Qué pérdidas iniciales/finales aplican?                                                                                   | Bloquea configuración y resultados reales.                           |
| Pregunta de implementación          | ¿Qué umbrales futuros por producto/especificación sustituirán o complementarán la política temporal inicial de 2 pulgadas? | Bloquea políticas específicas, no el registro del candidato inicial. |
| Decisión configurable               | ¿Qué objetivo, pesos y desempates usará el optimizador?                                                                    | Bloquea configuración inicial, no intercambiabilidad.                |
| Decisión futura no bloqueante       | ¿Qué algoritmo exacto o heurístico se seleccionará?                                                                        | Requiere benchmark con casos reales.                                 |
| Evidencia requerida                 | ¿Qué equipos, costos y tiempos reales se consideran?                                                                       | No se inventan; pueden diferirse si el primer objetivo es material.  |
| Pregunta de implementación          | ¿Cómo se corrige una medición errónea sin invalidar movimientos posteriores?                                               | Requiere casos de reverso y dependencias.                            |

## Supuestos

- El corte es un problema unidimensional de barras para el alcance inicial, pendiente de validar con casos reales.
- Las piezas pueden identificarse y medirse con precisión suficiente para trazabilidad.
- Existen remanentes potencialmente reutilizables; 2 pulgadas es el umbral temporal inicial de candidatura y la aptitud final permanece condicionada.
- El algoritmo puede ejecutarse detrás de un puerto sin filtrar su tecnología al dominio.
- Los requisitos técnicos de obra se reciben como restricciones externas aprobadas y no se modifican.

## Decisiones configurables

- Ancho de corte por proceso/equipo.
- Pérdidas iniciales, finales y de preparación.
- Remanente mínimo reutilizable.
- Prioridad de consumo de remanentes.
- Objetivo, ponderaciones y desempates.
- Límites de número de patrones o complejidad operativa.
- Política de medición y redondeo.
- Algoritmo/adaptador seleccionado después de benchmark.

Ningún valor configurable se incluye como constante en este ADR.

## Impacto sobre otros dominios

- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md) aporta entidad, unidad y contexto de taller.
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md) recibe tareas Migo para efectos que correspondan.
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md) aporta piezas disponibles, reservas y movimientos.
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md) aporta requisitos y recibe plan/costo autorizado.
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md) mantiene piezas externas separadas hasta una entrega/modalidad válida.
- Campo/calidad recibe piezas conforme a especificación aprobada, nunca una modificación automática del diseño.
- Reportes pueden comparar plan, ejecución, consumo, remanente y merma.

## Impacto de seguridad y auditoría

- Autorización para proponer, aprobar y ejecutar planes.
- Reserva/transacción breve para impedir doble consumo.
- Auditoría de entradas, parámetros, algoritmo, versión, resultado y aprobación.
- Auditoría de mediciones, ejecución, diferencias y reversos.
- Protección de costos y función objetivo conforme al rol.
- Datos originales del plan y ejecución no se sobrescriben.
- Pruebas de compatibilidad, balance y reproducción.
- La IA no aprueba parámetros ni cambia resultados.

## Estrategia de transición

1. Recopilar catálogo y casos reales anonimizados de corte.
2. Medir y aprobar parámetros por proceso antes de usarlos productivamente.
3. Definir contratos conceptuales de piezas, requisitos, plan, patrón y ejecución.
4. Construir un conjunto de problemas/soluciones esperadas para comparar algoritmos.
5. Validar primero planificación sin mutación y luego conciliación plan–real.
6. Integrar movimientos con ADR 0005 después de aprobar balance y reversos.

Este ADR no autoriza implementar un optimizador ni crear productos.

## Condiciones para pasar a ACEPTADO

- Israel ratifica funcionalmente la separación producto–pieza, plan–ejecución y corte–requisito técnico de obra.
- Christian y el responsable de taller ratifican que no se creará un SKU por corte ocasional y que merma/remanente deben quedar visibles.
- Se documentan casos reales o controlados suficientes para comprobar que el contrato conceptual representa entradas, piezas candidatas, parámetros identificados, plan, patrón y ejecución, sin convertir valores de prueba en parámetros productivos.
- Se demuestra con esos casos que el contrato conserva compatibilidad, balance, genealogía y diferencias plan–ejecución; los atributos y valores todavía no ratificados permanecen pendientes.
- Se documentan autoridad y estados mínimos para proponer, aprobar, ejecutar y conciliar un plan.
- Se ejecutan y documentan pruebas de diseño para: plan sin movimiento; ejecución balanceada; diferencia plan–real; remanente con origen; merma explícita; doble consumo rechazado; reproducción del mismo plan; restricción técnica de obra no modificada.
- La aceptación de este ADR no depende de seleccionar un algoritmo definitivo ni de completar un benchmark. El benchmark y la evidencia medida requerida serán condiciones para seleccionar el adaptador o habilitar el optimizador productivo.
- Se registran como pendientes los valores no medidos, costos, tiempos, tolerancias y objetivo definitivo.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-020`, `PROD-021` y `PROD-028`–`PROD-042`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md), cortes, piezas, remanentes y merma.
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `LOG-Q-011`, `LOG-Q-012`, `LOG-Q-016`–`LOG-Q-019`, `IMP-Q-013`, `CFG-006` y `CFG-007`.
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Manual Maestro v1.1](../../ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md), control de longitud/especificación y prohibición de rediseño.
- [Auditoría documental previa](../product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md), hallazgos de optimización de cortes.
- [ADR 0009](0009-manufactura-corte-subcontratado-propiedad-y-custodia.md).

## Relaciones con otros ADR

- Depende de ADR 0003, ADR 0005 y contratos comerciales de ADR 0006.
- Usa autoridad externa y tareas de ADR 0004 sin conocer formatos Migo.
- Se integra con ADR 0008 solo mediante disponibilidad/entrega externa controlada.
- Complementa ADR 0009: este ADR gobierna planificación/patrones y el ADR 0009 gobierna ejecución, servicio, propiedad, custodia y costos.
- No define pricing, propiedad externa ni especificaciones técnicas de obra.
