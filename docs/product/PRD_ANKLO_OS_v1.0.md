# Product Requirements Document — ANKLO-OS

- **Versión:** 1.0
- **Estado:** BORRADOR
- **Fecha:** 16 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade
- **Aprobación:** pendiente

> Este PRD es un borrador funcional basado en decisiones provisionales y ADR propuestos. No constituye aprobación jurídica, societaria, contable, tributaria, laboral ni técnica definitiva. Los asuntos identificados como pendientes no deben implementarse mediante supuestos silenciosos.

## 1. Control documental

| Campo                 | Valor                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Propósito             | Definir qué debe hacer ANKLO-OS, cómo se verificará y qué permanece pendiente.                                                |
| Audiencia             | Dirección funcional, decisión de negocio, usuarios operativos, arquitectura, UX, desarrollo, pruebas y revisores competentes. |
| Propietario funcional | Israel.                                                                                                                       |
| Decisor principal     | Christian Andrade; sus ratificaciones documentales permanecen pendientes cuando así se indica.                                |
| Estado de aprobación  | Pendiente de revisión y ratificación según la sección 32.                                                                     |
| Sustituye a           | Ningún ADR, documento canónico, contrato, plano, especificación, evaluación o MPII.                                           |
| Cambios futuros       | Una revisión debe registrar versión, fecha, secciones, motivo, autoridad y fuentes afectadas.                                 |

### 1.1 Jerarquía aplicada

1. Decisiones funcionales expresamente ratificadas y documentadas.
2. [ADR 0003](../adr/0003-modelo-grupo-entidad-unidad-contexto.md) a [ADR 0009](../adr/0009-manufactura-corte-subcontratado-propiedad-y-custodia.md), en su versión corregida actual y con estado propuesto.
3. [Registro de decisiones de producto v2.0](./decisions/Registro_Decisiones_Producto_v2.0.md).
4. [Mapa de fuentes de verdad v1.0](../architecture/mapa-fuentes-de-verdad-v1.0.md).
5. [Preguntas, supuestos y configuraciones pendientes v2.0](./decisions/Preguntas_Supuestos_Pendientes_v2.0.md).
6. [ADR 0001](../adr/0001-arquitectura-base.md) y [ADR 0002](../adr/0002-puertos-y-adaptadores.md).
7. Documentos canónicos v1.1, auditorías, discovery y documentos operativos según su autoridad y alcance.

Los ADR 0003–0009 siguen siendo propuestas. Su precedencia en este PRD evita recuperar decisiones desplazadas, pero no cambia su estado ni sustituye la ratificación requerida.

### 1.2 Convenciones

- `P0`, `P1` y `P2` expresan prioridad relativa de producto, no plazo ni compromiso comercial.
- `MVP obligatorio`, `MVP opcional sujeto a evidencia`, `posterior` y `fuera de alcance` expresan fase del producto.
- `Confirmado funcionalmente` significa decisión provisional disponible; no equivale a aprobación formal en otros ámbitos.
- Toda cifra operativa no aprobada se mantiene como línea base, configuración o decisión pendiente.

## 2. Resumen ejecutivo

ANKLO-OS será una plataforma operativa y comercial multiempresa complementaria a Migo. El producto conectará cotización, precios, reservas, abastecimiento, inventario operativo, conciliación y, en fases posteriores, taller y operación de campo, sin convertirse inicialmente en un ERP contable completo.

Durante 2026, Migo seguirá siendo el sistema oficial de Distripernos para contabilidad, facturación tributaria, registros contables de compras y ventas, cuentas por cobrar y pagar, facturas, notas de crédito, guías de remisión, demás documentos tributarios o contables aplicables y stock contable. Los tipos, nombres y capacidades exactos requieren evidencia real.

El MVP prioriza un corte vertical comercial-operativo explicable: contexto organizacional, clientes y catálogo mínimo, importación manual de un snapshot permitido, movimientos, ATP, cotizaciones versionadas, aprobación de precios, reservas, solicitudes de abastecimiento, cola Migo, conciliación básica, auditoría y reportes esenciales. Las capacidades sin evidencia suficiente no se implementarán mediante valores supuestos.

## 3. Antecedentes y problema

Distripernos gestiona suministro y operación comercial, mientras ANKLO actúa actualmente como su unidad operativa de servicios. La futura constitución de ANKLO como entidad independiente es una posibilidad no materializada. Paralelamente, Migo mantiene registros oficiales, pero ANKLO-OS necesita conocer compromisos y eventos internos antes de que aparezcan en el sistema externo.

Los problemas principales son:

- sobrepromesa por snapshots atrasados, reservas o salidas pendientes;
- cotizaciones que pueden perder la versión de precio aceptada;
- falta de trazabilidad entre operación interna y registro Migo;
- saldos o correcciones no explicables si se editan directamente;
- mezcla potencial de propiedad propia y externa;
- proliferación de productos si cada corte ocasional se trata como SKU;
- autoridad implícita por cargo o pertenencia al grupo;
- procesos de obra, calidad, SST y evidencia aún no suficientemente definidos para un MVP integral;
- recuperación de requisitos históricos incompatibles con los ADR corregidos.

## 4. Visión del producto

ANKLO-OS permitirá que cada operación responda, con autoridad y evidencia visibles:

1. quién actuó y bajo qué entidad, unidad y capacidad;
2. qué dato o documento gobernaba la decisión;
3. qué se prometió, reservó, movió, ejecutó o concilió;
4. qué permanece pendiente en Migo o ante una contraparte;
5. qué cambió, por qué, con qué revisión y quién lo autorizó.

La experiencia administrativa será densa y funcional. La experiencia de campo será móvil y orientada a tareas cuando ese dominio sea habilitado. El monolito modular y los puertos/adaptadores permitirán evolucionar integraciones sin filtrar formatos externos al dominio.

## 5. Objetivos

| Objetivo                                          | Medición prevista                                                                | Meta actual                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Reducir sobrepromesas de inventario               | Promesas que exceden ATP vigente y causas asociadas.                             | Línea base y meta pendientes.     |
| Mejorar trazabilidad de cotizaciones y precios    | Revisiones enviadas/aceptadas con política, precio y aprobación reproducibles.   | Línea base y meta pendientes.     |
| Mantener disponibilidad operativa explicable      | Consultas ATP con snapshot, fecha y componentes.                                 | Cobertura objetivo pendiente.     |
| Conservar movimientos y reversos                  | Correcciones realizadas por reverso y nuevo movimiento.                          | Sin edición ordinaria de saldo.   |
| Registrar pendientes de Migo                      | Operaciones internas con estado, responsable y antigüedad visibles.              | Línea base y umbrales pendientes. |
| Reducir diferencias no explicadas                 | Conciliaciones abiertas sin causa, autoridad o siguiente acción.                 | Línea base y meta pendientes.     |
| Controlar manufactura, cortes, remanentes y merma | Balance solicitud–plan–ejecución–recepción y genealogía en el incremento manual. | Meta pendiente de casos reales.   |
| Separar stock propio y externo                    | Consultas e informes sin mezcla de propiedad.                                    | Sin mezcla tolerada por diseño.   |
| Preservar préstamos y liquidaciones               | Obligaciones originales y saldos parciales explicables.                          | Meta posterior a evidencia.       |
| Mejorar trazabilidad de obras                     | Órdenes, evidencias, documentos y estados relacionados.                          | Línea base pendiente.             |
| Reducir tiempo de elaboración de informes         | Tiempo desde corte aprobado hasta informe emitido.                               | Línea base y meta pendientes.     |
| Mejorar calidad de datos                          | Registros rechazados, incompletos, duplicados o sin autoridad.                   | Línea base y meta pendientes.     |
| Mantener aislamiento multiempresa                 | Intentos y pruebas de acceso cruzado.                                            | Ningún acceso cruzado autorizado. |
| Evolucionar integraciones                         | Sustitución de adaptador sin reescribir reglas.                                  | Criterio cualitativo verificable. |

## 6. Resultados esperados

- Una cotización aceptada se reproduce con la revisión y el precio conocidos por el cliente.
- La disponibilidad distingue stock oficial, proyección y conteo físico.
- Cada reserva y movimiento tiene identidad idempotente, contexto y resultado auditable.
- Las operaciones pendientes de Migo son visibles hasta conciliación real.
- Las autoridades sensibles provienen de una matriz aprobada, no del nombre del cargo.
- El stock externo nunca aparece como propio y una entrega sin clasificar queda bloqueada.
- Los cortes futuros distinguen plan y ejecución sin alterar requisitos técnicos de obra.
- Obras, calidad y SST pueden incorporarse después mediante contratos públicos sin ciclos entre módulos.
- Los informes se generan desde datos aprobados y preservan fuentes y revisiones.

## 7. Métricas de éxito

| Métrica                               | Definición                                                       | Fuente                        | Estado                        |
| ------------------------------------- | ---------------------------------------------------------------- | ----------------------------- | ----------------------------- |
| Tasa de sobrepromesa                  | Cotizaciones/pedidos afectados por disponibilidad no sustentada. | ATP, reservas y pedidos.      | Línea base pendiente.         |
| Explicabilidad ATP                    | Resultados con snapshot, fecha, componentes y política visibles. | Consultas ATP.                | Línea base pendiente.         |
| Integridad de revisiones              | Cotizaciones enviadas o aceptadas sin mutación silenciosa.       | Historial de `QuoteRevision`. | Medible desde MVP.            |
| Diferencia de inventario no explicada | Conciliaciones con diferencia sin causa o siguiente acción.      | Conciliación.                 | Línea base pendiente.         |
| Duplicación de importaciones          | Efectos repetidos por reintento o reimportación lógica.          | Lotes y eventos.              | No aceptable.                 |
| Antigüedad de tareas Migo             | Tiempo por estado de consistencia.                               | Cola Migo.                    | Umbrales pendientes.          |
| Exposición de costos                  | Respuestas/exportaciones que revelan costos sin permiso.         | Auditoría y pruebas.          | No aceptable.                 |
| Tiempo de informe                     | Tiempo desde datos aprobados hasta informe emitido.              | Reportes.                     | Línea base pendiente.         |
| Completitud de trazabilidad           | Operaciones críticas con fuente, actor, contexto y correlación.  | Auditoría.                    | Cobertura objetivo pendiente. |
| Exactitud de corte                    | Diferencia plan–ejecución y merma explicada.                     | Corte posterior.              | Línea base posterior.         |

No se aprueban metas cuantitativas hasta medir una línea base representativa y documentar autoridad, periodo y población.

## 8. Principios del producto

- Autoridad explícita por dato, proceso, contexto y vigencia.
- Pertenencia no equivale a permiso; denegación por defecto.
- No reatribución histórica de entidades, documentos u operaciones.
- Registros aprobados o emitidos no se sobrescriben; se revisan o revierten.
- Stock y obligaciones se explican mediante eventos, no saldos editables.
- Consistencia eventual visible; una referencia no prueba conciliación.
- Validación de toda entrada no confiable en servidor.
- Configuración versionada sin modificar historia.
- Archivos originales preservados; cada transformación crea un derivado relacionado.
- Privacidad, minimización, acceso necesario y datos ficticios en desarrollo.
- La IA asiste y se abstiene; una persona competente decide ámbitos críticos.
- Contrato, planos, especificaciones, evaluaciones, MPII y normativa aplicables prevalecen en su ámbito.

## 9. Alcance

La visión del producto comprende:

- organizaciones, identidad, contexto, roles y delegaciones;
- clientes, catálogo y mapeos externos;
- cotizaciones, precios, reservas, abastecimiento y órdenes internas;
- inventario propio, movimientos, ATP, conteos y conciliación;
- integración manual con Migo y adaptadores futuros;
- inventario externo, obligaciones y liquidaciones;
- piezas, remanentes, merma y cortes;
- proyectos, obras, frentes, órdenes y campo;
- personal, cuadrillas, herramientas, activos, asistencia, gastos y viáticos;
- documentos, calidad, NCR, SST, informes, KPIs y auditoría.

La inclusión en la visión no implica inclusión en el MVP; la clasificación vinculante para este borrador está en la sección 24.

## 10. Fuera de alcance

- Contabilidad completa, asientos, nómina legal o facturación electrónica propia.
- Segunda factura tributaria emitida desde ANKLO-OS.
- Sustitución total de Migo durante 2026.
- Diseño físico de datos, tablas, esquema Prisma, migraciones o APIs.
- Reglas jurídicas, societarias, laborales, tributarias o contables definitivas.
- Parámetros universales de instalación, corte, calidad o SST sin fuente aprobada.
- Rediseño estructural o sustitución del criterio del diseñador.
- Generalización de acuerdos comerciales individuales.
- Automatización exclusiva de decisiones sobre seguridad, conformidad, disciplina, aptitud, pagos o derechos.
- Microservicios, BI, portal de cliente, RAG o IA productiva sin decisión posterior.

## 11. Modelo organizacional

### 11.1 Conceptos

- `BusinessGroup`: límite superior de tenant; no concede acceso transversal.
- `LegalEntity`: persona jurídica a la que se atribuyen documentos, propiedad y registros cuando corresponda.
- `BusinessUnit`: unidad operativa perteneciente a una entidad durante una vigencia.
- `OrganizationMembership`: relación de una identidad con un alcance; no equivale a autorización.
- `RoleAssignment`: capacidades explícitas para contexto y vigencia.
- `ActingContext`: grupo, entidad, unidad y capacidad bajo los que ocurre una acción.
- `TemporaryDelegation`: excepción limitada, vigente, revocable y auditable.

### 11.2 Reglas

- Distripernos es actualmente la entidad legal y ANKLO su unidad operativa.
- Una futura ANKLO S.A.S. se incorporará como nueva `LegalEntity` al existir evidencia y fecha efectiva.
- Las operaciones históricas conservan entidad, unidad y contexto originales.
- Operaciones abiertas requieren tratamiento explícito por tipo; no se transfieren masivamente.
- `ActingContext` se valida en servidor, queda visible y no eleva permisos al cambiarse.
- Reportes consolidados requieren permiso explícito de grupo.
- Toda delegación registra otorgante, receptor, alcance, motivo, inicio, vencimiento, revocación y uso.

## 12. Personas y actores

| Persona o capacidad                  | Necesidad funcional                                                              | Restricciones de autoridad                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Dueño/decisor de negocio             | Aprobar precios y decisiones comerciales reservadas; revisar consolidación.      | La delegación de precio es temporal; no sustituye autoridades técnicas, contables o legales. |
| Vendedor                             | Preparar cotizaciones, consultar ATP autorizado y solicitar abastecimiento.      | No recibe costos ni márgenes; no aprueba su propio precio.                                   |
| Actor comercial autorizado           | Revisar, enviar o registrar actos comerciales según matriz.                      | Capacidades concretas por asignar.                                                           |
| Actor de abastecimiento autorizado   | Registrar ofertas y coordinar fuentes.                                           | Registrar no equivale a aprobar ni confirmar disponibilidad.                                 |
| Actor de bodega                      | Capturar conteos, movimientos o importaciones según asignación.                  | El cargo no concede validación, ajuste o cierre.                                             |
| Responsable de validación de conteos | Validar evidencia y alcance del conteo.                                          | Capacidad por asignar mediante matriz.                                                       |
| Autoridad de ajustes                 | Aprobar ajustes sensibles y excepciones de segregación.                          | Capacidad por asignar y auditar.                                                             |
| Solicitante de manufactura/corte     | Registrar necesidad, producto esperado, cantidad, unidad, contexto y prioridad.  | No selecciona parámetros técnicos ni autoriza su propia excepción.                           |
| Propietario del material             | Mantener visible a quién pertenece el material entregado al proceso.             | Propiedad no se infiere de la ubicación ni de la custodia.                                   |
| Custodio del material                | Entregar, recibir o mantener material bajo custodia trazable.                    | Custodia no concede propiedad ni autoridad para consumir.                                    |
| Planificador manual                  | Preparar una propuesta determinista con entradas y configuración vigentes.       | No ejecuta ni aprueba automáticamente el plan que preparó.                                   |
| Técnico o ejecutor de corte          | Registrar ejecución real y mediciones.                                           | No selecciona parámetros no aprobados ni reescribe el plan.                                  |
| Aprobador de planes de corte         | Liberar un plan para ejecución.                                                  | Autoridad por asignar antes de habilitar corte productivo.                                   |
| Proveedor externo de corte           | Ejecutar el servicio subcontratado bajo alcance, custodia y evidencia acordados. | No recibe propiedad ni autoridad interna por prestar el servicio.                            |
| Receptor de resultados               | Verificar cantidades, clases de salida, identificación y evidencia recibidas.    | Recibir físicamente no cierra diferencias ni autoriza merma extraordinaria.                  |
| Responsable de conciliación de corte | Comparar solicitud, plan, ejecución, recepción y costo básico.                   | Cierre y excepciones requieren capacidad y segregación aprobadas.                            |
| Supervisor de obra                   | Coordinar frente, registros y escalamiento operativo.                            | No rediseña ni recibe autoridad implícita por el título.                                     |
| Técnico de campo                     | Ejecutar tareas, checklists y evidencias asignadas.                              | Solo dentro de procedimiento, obra y contexto vigentes.                                      |
| Calidad                              | Gestionar inspecciones, ITP, NCR y verificación.                                 | Autoridad concreta depende de contrato y matriz aprobada.                                    |
| SST                                  | Gestionar riesgos, permisos, incidencias y controles.                            | No sustituye análisis de aplicabilidad ni autoridad competente.                              |
| Administración                       | Configurar y operar capacidades administrativas autorizadas.                     | No crea política comercial por administración técnica.                                       |
| Contabilidad                         | Validar fronteras y efectos oficiales en Migo.                                   | ANKLO-OS no le atribuye autoridad fuera del proceso real.                                    |
| Usuario de consulta consolidada      | Consultar información de grupo autorizada.                                       | Requiere permiso explícito y finalidad.                                                      |
| Administrador técnico de plataforma  | Configurar políticas ya aprobadas, identidad técnica y operación de plataforma.  | No crea unilateralmente precios, visibilidad, materialidad ni reglas comerciales.            |

## 13. Matriz provisional de capacidades

| Acción                       | Capacidad necesaria             | Actor conocido                        | Autoridad ratificada            | Pendiente                         | Segregación requerida                                                 |
| ---------------------------- | ------------------------------- | ------------------------------------- | ------------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| Cambiar `ActingContext`      | Seleccionar contexto autorizado | Usuario autenticado                   | Regla funcional provisional     | Matriz de alcances reales         | Cambio no eleva privilegios.                                          |
| Consultar consolidado        | Consulta de grupo               | Dueño o usuario autorizado            | Necesidad funcional provisional | Asignación y finalidad            | Separar administración técnica de acceso.                             |
| Preparar cotización          | Crear revisión                  | Vendedor/actor comercial              | Capacidad funcional             | Alcances de envío                 | No implica aprobar precio.                                            |
| Aprobar precio               | Aprobar versión exacta          | Dueño                                 | Confirmado funcionalmente       | Ratificación documental           | Preparador no se autoaprueba sin autoridad.                           |
| Aprobar precio delegado      | Delegación temporal             | Persona delegada                      | Excepción funcional             | Límites y vigencia                | Delegación auditable y revocable.                                     |
| Acceder a costos             | Ver dato restringido            | Dueño                                 | Confirmado funcionalmente       | Cualquier acceso adicional        | No se presume por cargo.                                              |
| Definir precisión ATP        | Aprobar política comercial      | Por asignar                           | No ratificada                   | Política y autoridad              | Administrador técnico solo configura.                                 |
| Registrar `SupplierOffer`    | Registrar oferta                | Actor comercial/abastecimiento        | No ratificada                   | Rol y contexto                    | Registrar no aprueba.                                                 |
| Importar snapshot            | Ejecutar importación permitida  | Actor autorizado                      | Capacidad, no cargo             | Canal y matriz                    | Importador no aprueba ajustes.                                        |
| Contar inventario            | Registrar observación           | Actor autorizado                      | Capacidad, no cargo             | Matriz                            | Separar de validación sensible.                                       |
| Validar conteo               | Validar sesión/evidencia        | Por asignar                           | No ratificada                   | Matriz                            | No aprobar ajuste propio sensible.                                    |
| Aprobar ajuste               | Autorizar movimiento correctivo | Por asignar                           | No ratificada                   | Materialidad y matriz             | Creador y aprobador distintos salvo excepción auditada.               |
| Cerrar conciliación          | Resolver/cerrar                 | Por asignar                           | No ratificada                   | Regla exacta/material             | Diferencias materiales escalan.                                       |
| Solicitar manufactura/corte  | Crear solicitud trazable        | Solicitante autorizado                | Regla funcional provisional     | Usuarios y alcances reales        | Solicitar no planifica, ejecuta ni aprueba.                           |
| Leer solicitud de corte      | `cut_request:read`              | Actor autorizado                      | Aprobación funcional de Israel  | Identidades y asignaciones reales | No concede acceso al historial ni al motivo de cancelación.           |
| Leer historial de corte      | `cut_request:read_history`      | Actor autorizado                      | Aprobación funcional de Israel  | Identidades y asignaciones reales | Requiere además acceso a la solicitud; no expone snapshots completos. |
| Preparar plan manual         | Planificar entradas y salidas   | Planificador autorizado               | Regla funcional provisional     | Matriz y parámetros medidos       | Preparador no libera su plan sin capacidad adicional.                 |
| Aprobar plan de corte        | Liberar plan                    | Por asignar                           | No ratificada                   | Matriz de taller                  | Aprobación no equivale a ejecución.                                   |
| Asignar material/custodia    | Entregar material al proceso    | Custodio autorizado                   | Regla funcional provisional     | Matriz y evidencia de entrega     | No cambia propiedad ni confirma consumo.                              |
| Registrar ejecución          | Confirmar hechos físicos        | Ejecutor interno o externo autorizado | Regla funcional provisional     | Usuarios, tolerancias y formatos  | No modifica el plan aprobado.                                         |
| Recibir resultados           | Confirmar recepción             | Receptor autorizado                   | Regla funcional provisional     | Matriz y criterios medidos        | Recepción no equivale a conciliación.                                 |
| Cerrar conciliación de corte | Resolver balance y diferencias  | Por asignar                           | No ratificada                   | Umbrales, autoridad y Migo        | Merma extraordinaria y cierre exigen segregación.                     |
| Clasificar entrega externa   | Aprobar modalidad               | Por asignar                           | No ratificada                   | Acuerdo, propiedad y documentos   | Registro físico separado de clasificación.                            |
| Decidir técnicamente en obra | Aprobar cambio técnico          | Autoridad competente externa/interna  | Depende de fuentes aplicables   | Matriz por contrato               | Supervisor no rediseña.                                               |

## 14. Flujos de negocio

### 14.1 Acceso y contexto

1. La persona se autentica.
2. El servidor resuelve membresías, asignaciones, vigencias y delegaciones.
3. La persona selecciona un `ActingContext` permitido.
4. Cada acción valida nuevamente entidad, unidad, capacidad, estado y alcance.
5. La operación conserva contexto y auditoría, incluso si después cambia la organización.

### 14.2 Cotización, abastecimiento y pedido

1. El vendedor selecciona cliente, contexto y catálogo autorizado.
2. Consulta ATP con fecha, precisión y advertencias aplicables.
3. Crea `Quote` y una `QuoteRevision` con política y disponibilidad observada.
4. Si existe faltante, crea `SupplyRequest`; un actor autorizado registra `SupplierOffer`.
5. El dueño o una delegación vigente aprueba el precio.
6. Enviar congela la revisión; cualquier cambio crea otra.
7. La aceptación identifica revisión y evidencia exactas.
8. Se originan pedido, reservas y orden de venta interna según política.
9. El registro oficial posterior sigue la cola Migo.

### 14.3 Inventario y ATP

1. Se importa un snapshot Migo permitido como lote inmutable.
2. El sistema proyecta movimientos, reservas y pendientes confirmados.
3. ATP se calcula con componentes y vigencia visibles.
4. Las reservas concurrentes se validan de forma transaccional.
5. Un conteo registra realidad observada sin sobrescribir saldo.
6. Las diferencias se revisan, ajustan mediante movimientos y concilian bajo matriz aprobada.

### 14.4 Coexistencia con Migo

`PENDIENTE_MIGO -> EN_REGISTRO -> REGISTRADO_MIGO -> PENDIENTE_CONCILIACION -> CONCILIADO`

Una referencia externa no acredita coincidencia. `REGISTRADO_MIGO` no equivale a `CONCILIADO`. Los errores, reintentos y diferencias permanecen visibles; ANKLO-OS no genera una segunda factura tributaria.

### 14.5 Piezas y cortes

1. Una necesidad autorizada crea una `ManufacturingRequest` o `CutRequest` con organización, solicitante, producto esperado, cantidad, unidad, prioridad, destino y evidencia disponible.
2. El planificador selecciona manualmente material compatible y prepara `CutPlan`/`CutPattern` con entradas ordenadas, configuración versionada y salidas esperadas. El optimizador permanece fuera del primer incremento.
3. El plan se revisa y aprueba por capacidad; aprobarlo no reserva, consume ni modifica inventario por sí mismo.
4. La asignación identifica pieza, propietario, custodio, ubicación y, cuando aplique, proveedor externo bajo modalidad aprobada.
5. `CutExecution` registra hechos físicos: material consumido, cortes realizados, producto, remanente, pérdida, residuo, mediciones, actor, tiempo y evidencia.
6. La recepción verifica cantidades, identificación, clases de salida y evidencia sin cerrar automáticamente diferencias.
7. La conciliación compara solicitud, plan, ejecución, recepción y costo básico; una corrección agrega evento o revisión y conserva los hechos anteriores.
8. Solo la ejecución confirmada y autorizada origina movimientos y genealogía. Una diferencia no cambia requisitos técnicos de obra.

El ciclo funcional mínimo es `BORRADOR -> SOLICITADA -> EN_PLANIFICACION -> PENDIENTE_APROBACION -> APROBADA -> ASIGNADA -> EN_EJECUCION -> PENDIENTE_RECEPCION -> RECIBIDA -> PENDIENTE_CONCILIACION -> CERRADA`, con salidas controladas `RECHAZADA`, `SUSTITUIDA`, `BLOQUEADA` y `CANCELADA`. Cada transición crítica conserva actor autorizado, fecha, motivo y auditoría. Estos nombres son una vista funcional unificada para aceptación; los estados conceptuales detallados del ADR 0009 permanecen **PROPUESTOS** y deberán cerrarse en diseño sin perder la correspondencia ni el historial.

### 14.6 Inventario externo y obligaciones

1. Se registra una observación externa con fuente y vigencia.
2. Confirmar, reservar, entregar y vencer son transiciones distintas.
3. Una entrega sin modalidad queda `PENDIENTE_CLASIFICACION`.
4. La clasificación aprobada determina qué flujo operativo puede continuar.
5. El registro original de obligación no se sobrescribe; liquidaciones parciales o mixtas agregan movimientos.
6. La conciliación con la contraparte permanece separada de Migo.

### 14.7 Obras y operación de campo

1. Cliente, proyecto, obra, frente y orden delimitan el contexto.
2. Se asignan cuadrilla, herramientas, documentos y requisitos aprobados.
3. El frente se libera o bloquea mediante criterios configurados desde fuentes competentes.
4. La ejecución registra parte diario, asistencia/horas, materiales, evidencia e incidencias.
5. Calidad y SST observan mediante contratos públicos, sin ciclos con campo.
6. NCR, RFI o cambio se escalan sin modificar diseño por inferencia.
7. Informes y dossier se derivan de datos aprobados y revisiones vigentes.

## 15. Requisitos funcionales

### 15.1 Organización y acceso

#### FR-ORG-001 — Contexto organizacional explícito

- **Descripción:** representar grupo, entidad, unidad, membresía, asignación y contexto sin tratarlos como sinónimos.
- **Actor o capacidad:** usuario autenticado y servicio de autorización.
- **Precondiciones:** identidad autenticada, membresía y asignación vigentes.
- **Comportamiento esperado y resultado:** el servidor ofrece solo contextos permitidos; cada operación conserva `LegalEntity`, `BusinessUnit` y `ActingContext` originales.
- **Reglas relacionadas:** pertenencia no autoriza; cambio de contexto no eleva privilegios; no reatribución histórica.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_DECISION` para entidades y membresías reales, aunque el patrón está definido.
- **Fuente:** ADR 0003; `PROD-003`–`PROD-005`; `ADR-Q-001`.
- **Criterio de aceptación:** un contexto no asignado es rechazado y una operación histórica mantiene su contexto tras cambiar membresías.

#### FR-ORG-002 — Capacidades y delegación

- **Descripción:** evaluar capacidades explícitas y delegaciones temporales por acción y alcance.
- **Actor o capacidad:** usuario, otorgante autorizado y servicio de autorización.
- **Precondiciones:** asignación o delegación con alcance, vigencia y estado válidos.
- **Comportamiento esperado y resultado:** una acción sensible se permite solo si existe capacidad efectiva; el uso de delegación queda vinculado a la decisión.
- **Reglas relacionadas:** delegación limitada, revocable, auditable y no superior a la autoridad delegable.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_DECISION` hasta ratificar la matriz real.
- **Fuente:** ADR 0003; `PROD-005`; `CFG-011`; `IMP-Q-005`.
- **Criterio de aceptación:** una delegación vencida o revocada no autoriza y su intento queda auditado.

#### FR-ORG-003 — Consulta consolidada controlada

- **Descripción:** permitir consolidación de grupo sin omitir filtros organizacionales.
- **Actor o capacidad:** usuario con permiso explícito de consulta consolidada.
- **Precondiciones:** finalidad, alcance y permiso de grupo vigentes.
- **Comportamiento esperado y resultado:** el informe etiqueta entidades, filtros, actor, contexto y fecha.
- **Reglas relacionadas:** el administrador técnico no obtiene acceso por función técnica; mínimo privilegio.
- **Prioridad, fase y estado:** P1; MVP opcional sujeto a evidencia; configurable.
- **Fuente:** ADR 0003; `PROD-005`; `IMP-Q-015`.
- **Criterio de aceptación:** un usuario sin permiso de grupo no puede consultar ni exportar datos consolidados.

### 15.2 Migo y consistencia

#### FR-MIGO-001 — Documentos internos y autoridad externa

- **Descripción:** separar cotización, reserva, pedido, orden interna y despacho de los registros y documentos oficiales de Migo.
- **Actor o capacidad:** operación comercial y contabilidad.
- **Precondiciones:** operación interna confirmada bajo entidad y periodo identificados.
- **Comportamiento esperado y resultado:** ANKLO-OS conserva documento interno y referencia externa sin presentarlo como documento tributario.
- **Reglas relacionadas:** Migo mantiene autoridad oficial definida durante 2026; no segunda factura tributaria; tipos exactos pendientes.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente.
- **Fuente:** ADR 0004; `PROD-002`, `PROD-006`, `PROD-014`; `LOG-Q-004`.
- **Criterio de aceptación:** una orden interna nunca se etiqueta como factura y puede existir sin referencia externa mientras permanezca pendiente.

#### FR-MIGO-002 — Cola de registro y conciliación

- **Descripción:** gestionar la secuencia desde operación interna hasta conciliación Migo.
- **Actor o capacidad:** actor autorizado de registro y autoridad de conciliación por asignar.
- **Precondiciones:** identificador interno estable y operación que requiere registro externo.
- **Comportamiento esperado y resultado:** cada transición conserva actor, contexto, tiempo, evidencia y motivo; la referencia conduce a revisión, no a cierre automático.
- **Reglas relacionadas:** `REGISTRADO_MIGO` distinto de `CONCILIADO`; consistencia eventual visible.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_EVIDENCIA` para contratos documentales y autoridad de cierre.
- **Fuente:** ADR 0004; `PROD-014`; `IMP-Q-009`, `IMP-Q-010`.
- **Criterio de aceptación:** registrar una referencia deja la tarea pendiente de conciliación hasta comparar contenido y autoridad.

#### FR-MIGO-003 — Lotes e importación idempotente

- **Descripción:** recibir archivos permitidos como originales asociados a lotes inmutables.
- **Actor o capacidad:** importador autorizado y adaptador de importación; solo se denomina adaptador Migo validado después de probar muestras autorizadas.
- **Precondiciones:** archivo permitido, tipo esperado, contexto y fuente identificados.
- **Comportamiento esperado y resultado:** el lote registra resultado por archivo/fila; errores parciales permanecen visibles y repetir la misma importación lógica no duplica efectos.
- **Reglas relacionadas:** entrada no confiable validada en servidor; hash no sustituye clave semántica; original preservado.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_EVIDENCIA` hasta disponer de muestra autorizada y contrato de datos.
- **Fuente:** ADR 0004; `PROD-009`, `PROD-010`; `LOG-Q-001`–`LOG-Q-006`; `SUP-002`.
- **Criterio de aceptación:** con un contrato neutral y datos ficticios, reimportar un lote reconocido no crea otro snapshot, movimiento o tarea; la compatibilidad real con Migo requiere repetir el criterio con una muestra autorizada.

#### FR-MIGO-004 — Adaptador sustituible

- **Descripción:** expresar importación, referencias y conciliación mediante capacidades neutrales al formato externo.
- **Actor o capacidad:** composición de aplicación y adaptador autorizado.
- **Precondiciones:** contrato funcional aprobado para la capacidad.
- **Comportamiento esperado y resultado:** un adaptador ficticio o manual puede probar el contrato neutral; solo una integración verificada con muestras autorizadas puede presentarse como adaptador Migo validado, sin cambiar reglas del dominio.
- **Reglas relacionadas:** no presumir API, webhook, escritura ni reserva; no filtrar columnas o SDK al dominio.
- **Prioridad, fase y estado:** P1; MVP obligatorio para frontera neutral; `LISTO_PARA_DISENO` con adaptador ficticio/manual, pero integración Migo `BLOQUEADO_POR_EVIDENCIA`.
- **Fuente:** ADR 0002, ADR 0004; `PROD-008`, `PROD-009`; `SUP-001`.
- **Criterio de aceptación:** una prueba de contrato puede ejecutar el caso de uso con un adaptador ficticio sin tipos de Migo en el dominio.

### 15.3 Inventario y ATP

#### FR-INV-001 — Perspectivas y definiciones de inventario

- **Descripción:** distinguir snapshot, movimiento, saldo proyectado, ATP, conteo, ajuste y conciliación.
- **Actor o capacidad:** consulta de inventario y servicios de proyección.
- **Precondiciones:** entidad, producto, ubicación, fecha y perspectiva identificados.
- **Comportamiento esperado y resultado:** cada consulta etiqueta perspectiva y autoridad; ninguna sustituye automáticamente a otra.
- **Reglas relacionadas:** snapshot inmutable; conteo como observación; ATP no contable.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente.
- **Fuente:** ADR 0005; `PROD-007`; `ADR-Q-004`.
- **Criterio de aceptación:** una pantalla o exportación permite distinguir sin ambigüedad stock oficial, proyección y conteo.

#### FR-INV-002 — Movimientos, balance y reversos

- **Descripción:** derivar inventario operativo desde movimientos autorizados y corregir mediante reversos.
- **Actor o capacidad:** caso de uso autorizado de inventario.
- **Precondiciones:** contexto, producto, unidad, ubicación, cantidad y referencia válidos.
- **Comportamiento esperado y resultado:** el movimiento produce efecto balanceado; un error crea reverso enlazado y nuevo movimiento.
- **Reglas relacionadas:** no edición directa de saldo; original inmutable; transacción breve e idempotencia.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente.
- **Fuente:** ADR 0005; `PROD-011`; `LOG-Q-013`.
- **Criterio de aceptación:** no existe caso ordinario para editar saldo y el historial reconstruye el valor antes y después de una corrección.

#### FR-INV-003 — Cálculo explicable de ATP

- **Descripción:** calcular ATP desde el último snapshot válido y los componentes aprobados.
- **Actor o capacidad:** vendedor y actor comercial autorizado, con precisión aprobada.
- **Precondiciones:** snapshot seleccionado, política de vigencia y componentes identificados.
- **Comportamiento esperado y resultado:** devuelve cantidad o estado permitido, snapshot, fecha, desglose y advertencia/degradación.
- **Reglas relacionadas:** fórmula de ADR 0005; stock externo excluido; política de snapshot vencido pendiente.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_DECISION` hasta aprobar vigencia y degradación del snapshot.
- **Fuente:** ADR 0005; `PROD-012`; `IMP-Q-002`, `IMP-Q-003`, `IMP-Q-008`.
- **Criterio de aceptación:** el resultado cambia de forma determinista ante una reserva o salida confirmada y nunca se presenta como stock contable.

#### FR-INV-004 — Reservas concurrentes

- **Descripción:** crear, convertir, liberar, vencer o consumir compromisos operativos sin doble reserva.
- **Actor o capacidad:** caso comercial autorizado.
- **Precondiciones:** ATP suficiente, política vigente e identificador idempotente.
- **Comportamiento esperado y resultado:** la operación confirma una sola reserva o rechaza con causa; el ATP refleja el compromiso.
- **Reglas relacionadas:** transacción breve; una reserva no modifica Migo; plazos de ADR 0006.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente/configurable.
- **Fuente:** ADR 0005, ADR 0006; `PROD-019`; `CFG-005`.
- **Criterio de aceptación:** dos solicitudes concurrentes no reservan más disponibilidad que la permitida y un reintento no duplica el compromiso.

#### FR-INV-005 — Conteo, ajuste y conciliación segregados

- **Descripción:** registrar conteos, diferencias, ajustes y cierres como capacidades separadas.
- **Actor o capacidad:** actores asignados por matriz de autoridad.
- **Precondiciones:** sesión de conteo, alcance, evidencia y perspectiva comparada.
- **Comportamiento esperado y resultado:** una diferencia abre conciliación; un ajuste aprobado crea movimientos; el cierre conserva resolución o pendiente.
- **Reglas relacionadas:** no autoridad por cargo; creador distinto del aprobador sensible salvo excepción expresa auditada; materialidad configurable.
- **Prioridad, fase y estado:** P1; conteo/diferencia básicos en MVP; `BLOQUEADO_POR_DECISION` para validación, ajuste y cierre.
- **Fuente:** ADR 0005 corregido; `PROD-013` desplazado en asignaciones nominales; `IMP-Q-005`, `IMP-Q-010`, `IMP-Q-011`; `CFG-009`.
- **Criterio de aceptación:** un conteo diferente no sobrescribe saldo y una persona sin capacidad aprobada no valida, ajusta ni cierra.

### 15.4 Cotizaciones, precios y abastecimiento

#### FR-COM-001 — Clientes y catálogo mínimo controlado

- **Descripción:** mantener clientes y productos mínimos necesarios para cotizar, mapear Migo y consultar inventario.
- **Actor o capacidad:** gestor autorizado de datos maestros y actor comercial.
- **Precondiciones:** entidad, fuente, vigencia y atributos mínimos aprobados.
- **Comportamiento esperado y resultado:** el sistema reutiliza identidades y conserva mapeos externos versionados sin atribuir autoridad pendiente.
- **Reglas relacionadas:** autoridad por atributo; no confundir código contable con especificación operativa.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_EVIDENCIA` hasta aprobar catálogo, unidades y mapeos.
- **Fuente:** ADR 0006, con ADR 0004 para el mapeo externo; `ADR-Q-002`; `LOG-Q-011`; mapa de fuentes de verdad.
- **Criterio de aceptación:** un producto cotizado e importado conserva el mismo mapeo verificable y una incompatibilidad de unidad se rechaza.

#### FR-COM-002 — Cotización y revisiones inmutables

- **Descripción:** gestionar `Quote` y `QuoteRevision` con envío, aceptación, rechazo, expiración y revisión superada.
- **Actor o capacidad:** vendedor y actor comercial autorizado.
- **Precondiciones:** cliente, contexto, líneas, precios, vigencia y supuestos válidos.
- **Comportamiento esperado y resultado:** enviar congela la revisión; todo cambio crea otra; aceptar conserva revisión y precio.
- **Reglas relacionadas:** no recálculo silencioso; evidencia de aceptación pendiente; documentos internos separados de Migo.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_EVIDENCIA` para aceptación, canal y versión exacta.
- **Fuente:** ADR 0006; `PROD-018`; `IMP-Q-007`.
- **Criterio de aceptación:** cambiar costo o política después del envío no modifica la revisión enviada o aceptada.

#### FR-COM-003 — Precio versionado y aprobación

- **Descripción:** calcular y conservar `PriceBook`, P1–P4, `PricePolicy` y `PriceVersion`.
- **Actor o capacidad:** servicio de pricing, dueño y persona temporalmente delegada.
- **Precondiciones:** entradas, fuente, método, vigencia y contexto identificados.
- **Comportamiento esperado y resultado:** el cálculo conserva regla, versión, resultado y aprobación; el vendedor recibe precio sin costos ni márgenes.
- **Reglas relacionadas:** dueño aprueba; delegación excepcional; P1–P4 configurables; margen, recargo, tabla, manual o combinación sin fórmulas inventadas.
- **Prioridad, fase y estado:** P0; MVP obligatorio; `BLOQUEADO_POR_DECISION` para reglas iniciales, costos y delegaciones.
- **Fuente:** ADR 0006; `PROD-015`–`PROD-018`; `CFG-002`–`CFG-004`, `CFG-010`, `CFG-011`.
- **Criterio de aceptación:** la respuesta para vendedor omite costos/márgenes y una delegación vencida no puede aprobar.

#### FR-COM-004 — Política de precisión ATP

- **Descripción:** aplicar precisión visible de ATP conforme a política comercial autorizada.
- **Actor o capacidad:** servicio de consulta; administrador técnico configura una política ya aprobada.
- **Precondiciones:** política vigente asociada a contexto y audiencia.
- **Comportamiento esperado y resultado:** la respuesta muestra cantidad, banda, redondeo u ocultamiento aprobados sin revelar más precisión.
- **Reglas relacionadas:** administración técnica no crea la política; no permiso por cargo.
- **Prioridad, fase y estado:** P1; MVP obligatorio; `BLOQUEADO_POR_DECISION` hasta ratificar precisión y autoridad.
- **Fuente:** ADR 0006 corregido; `PROD-015` desplazado parcialmente; `IMP-Q-003`; `CFG-001`.
- **Criterio de aceptación:** cambiar configuración sin referencia a política aprobada es rechazado y queda auditado.

#### FR-COM-005 — Solicitud y oferta de abastecimiento

- **Descripción:** crear `SupplyRequest` ante faltante y registrar `SupplierOffer` versionada.
- **Actor o capacidad:** vendedor solicita; actor comercial o de abastecimiento autorizado registra.
- **Precondiciones:** faltante/necesidad, contexto y fuente identificados.
- **Comportamiento esperado y resultado:** la oferta conserva contraparte, vigencia, cantidad, dato económico restringido, condiciones conocidas y evidencia.
- **Reglas relacionadas:** registrar no aprueba; rol concreto pendiente; observación externa no es ATP propio.
- **Prioridad, fase y estado:** P1; solicitud MVP obligatoria y `LISTO_PARA_DISENO`; oferta `OPCIONAL` y bloqueada por matriz/evidencia.
- **Fuente:** ADR 0006, con ADR 0008 solo para abastecimiento externo; `PROD-016` desplazado en cargos; `IMP-Q-005`.
- **Criterio de aceptación:** un actor sin capacidad no registra oferta y una oferta registrada no cambia disponibilidad ni precio aprobado.

#### FR-COM-006 — Política de reservas y precio ante faltante

- **Descripción:** aplicar reservas blandas/firmes y la regla de precio alternativo por línea.
- **Actor o capacidad:** servicio comercial y dueño para excepciones.
- **Precondiciones:** política versionada, revisión de cotización y ATP válidos.
- **Comportamiento esperado y resultado:** autorización interna usa 45 minutos, reserva blanda 24 horas, máximo ordinario 48 horas y reserva firme hasta despacho o cancelación como valores iniciales configurables; por defecto el nuevo precio cubre toda la línea.
- **Reglas relacionadas:** expiración adicional de firme requiere política aprobada; solo el dueño autoriza precio solo para faltante; cambios de política no alteran historia.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente/configurable.
- **Fuente:** ADR 0006, con ADR 0005 para ejecución sobre ATP; `PROD-017`, `PROD-019` desplazado respecto de expiración firme; `CFG-004`, `CFG-005`.
- **Criterio de aceptación:** una firme no vence por regla no aprobada y una excepción solo-faltante conserva aprobador, motivo y revisión.

### 15.5 Piezas, remanentes y cortes

#### FR-CUT-001 — Piezas y genealogía

- **Descripción:** relacionar producto base, `MaterialPiece`, `PieceSpecification`, origen y resultados sin crear SKU por corte ocasional.
- **Actor o capacidad:** inventario, custodia y manufactura autorizados.
- **Precondiciones:** producto/especificación compatibles; pieza identificada; propiedad, custodia, cantidad y unidad visibles.
- **Comportamiento esperado y resultado:** cada pieza resultante conserva organización, producto, origen, ejecución, longitud, unidad, ubicación, propietario, custodio y estado.
- **Reglas relacionadas:** catálogo estable; propiedad distinta de custodia; genealogía inmutable; correcciones conforme a inventario.
- **Prioridad, fase y estado:** P1; primer incremento manual; confirmado funcionalmente con catálogo y precisión pendientes.
- **Fuente:** ADR 0005, ADR 0007 y ADR 0009 propuesto; `PROD-028`, `PROD-031`–`PROD-035`, `PROD-041`; `LOG-Q-011`, `LOG-Q-012`, `LOG-Q-019`.
- **Criterio de aceptación:** una pieza ocasional no crea producto nuevo y su genealogía llega hasta la pieza origen.

#### FR-CUT-002 — Plan reproducible e intercambiable

- **Descripción:** producir `CutPlan` y `CutPattern` mediante un adaptador intercambiable.
- **Actor o capacidad:** planificador autorizado y adaptador de optimización.
- **Precondiciones:** requisitos, piezas candidatas, parámetros, objetivo y versión aprobados.
- **Comportamiento esperado y resultado:** la misma entrada ordenada, configuración y versión produce un resultado reproducible; si hay aleatoriedad, conserva semilla.
- **Reglas relacionadas:** plan no modifica stock; IA generativa no optimiza; algoritmo y parámetros pendientes.
- **Prioridad, fase y estado:** P2; posterior al incremento manual; configurable/pendiente.
- **Fuente:** ADR 0007; decisión histórica `PROD-020`; `LOG-Q-016`–`LOG-Q-019`; `IMP-Q-013`; `CFG-006`, `CFG-007`.
- **Criterio de aceptación:** repetir un caso controlado reproduce el plan según contrato y cambiar algoritmo no cambia las entidades de dominio.

#### FR-CUT-003 — Ejecución física y genealogía

- **Descripción:** registrar `CutExecution`, consumo, producto, remanente, pérdida, residuo, mediciones y evidencia.
- **Actor o capacidad:** ejecutor interno o proveedor externo autorizado.
- **Precondiciones:** plan aprobado, material asignado, propiedad/custodia visibles y parámetros aplicables vigentes.
- **Comportamiento esperado y resultado:** registra asignación, cambio de custodia operativa, inicio, ejecutor, entradas reales, piezas realmente producidas, producto terminado, remanentes, pérdida normal, pérdida extraordinaria, residuo recuperable, evidencia, incidencias y cierre de ejecución. Solo la ejecución confirmada genera movimientos y genealogía balanceados; plan, ejecución y recepción permanecen separados.
- **Reglas relacionadas:** no reescribir plan; no cambiar diámetro, grado, embebido ni diseño de obra.
- **Prioridad, fase y estado:** P1; primer incremento manual; confirmado funcionalmente con autoridades y parámetros pendientes.
- **Fuente:** ADR 0005, ADR 0007 y ADR 0009 propuesto; `PROD-028`, `PROD-029`, `PROD-034`–`PROD-037`, `PROD-041`.
- **Criterio de aceptación:** aprobar un plan no consume stock; ejecutar genera piezas y merma y registra cualquier diferencia.

#### FR-CUT-004 — Solicitud de manufactura o corte

- **Descripción:** registrar la necesidad sin convertirla en plan ni instrucción técnica.
- **Actor o capacidad:** solicitante autorizado.
- **Precondiciones:** empresa/unidad solicitante y contexto válidos.
- **Comportamiento esperado y resultado:** crea una solicitud trazable, revisable y cancelable que identifica solicitante, propietario, custodio actual, ejecutor previsto, proveedor cuando corresponda, referencia comercial u operativa, prioridad, fecha requerida, material o familia, piezas solicitadas, longitud, cantidad, unidad, tolerancia solo si está aprobada, observaciones, evidencia y estado. Los datos faltantes o incompatibles impiden enviarla a planificación.
- **Reglas relacionadas:** toda entrada se valida; solicitud no consume ni reserva material; no se inventan tolerancias o parámetros.
- **Prioridad, fase y estado:** P1; primer incremento manual; listo documentalmente con catálogo, precisión y usuarios reales pendientes.
- **Fuente:** ADR 0006, ADR 0007 y ADR 0009 propuesto; `PROD-028`, `PROD-029`, `PROD-034`, `PROD-040`–`PROD-042`; `LOG-Q-011`, `LOG-Q-012`, `LOG-Q-021`, `LOG-Q-028`.
- **Criterio de aceptación:** una solicitud completa pasa a planificación sin efectos de inventario; una incompleta se rechaza con causas por campo.

#### FR-CUT-005 — Planificación manual determinista

- **Descripción:** preparar manualmente un plan reproducible con materiales candidatos, patrones, secuencia y salidas esperadas.
- **Actor o capacidad:** planificador autorizado y aprobador de plan.
- **Precondiciones:** solicitud revisable, material compatible, unidades/precisión y configuración aplicable identificadas.
- **Comportamiento esperado y resultado:** guarda selección manual de barras/segmentos, identificación física, longitud disponible, patrón y secuencia manuales, kerf de configuración aprobada, pérdidas normales adicionales solo si están aprobadas, piezas y consumo previstos, remanentes, merma normal y residuo recuperable previstos, costo básico estimado, configuración, revisión, versión, autor y aprobación. Repetir las mismas decisiones manuales produce la misma propuesta. Sin kerf aprobado, el plan no puede liberarse para ejecución.
- **Reglas relacionadas:** plan no modifica stock; optimización automática fuera del primer incremento; el umbral temporal de remanente de 2 pulgadas es configuración revisable, no tolerancia de corte.
- **Prioridad, fase y estado:** P1; primer incremento manual; bloqueado para ejecución productiva hasta cargar kerf y tolerancias aprobados.
- **Fuente:** ADR 0007 y ADR 0009 propuesto; `PROD-036`, `PROD-040`–`PROD-042`; `LOG-Q-016`, `LOG-Q-018`, `LOG-Q-019`, `LOG-Q-021`; `CFG-015`.
- **Criterio de aceptación:** el plan conserva versión y entradas; aprobarlo no consume material y falta de kerf aplicable impide su liberación.

#### FR-CUT-006 — Asignación, propiedad, custodia y subcontratación

- **Descripción:** asignar material al proceso conservando quién es propietario, quién lo custodia y quién ejecutará.
- **Actor o capacidad:** custodio, planificador y autoridad de asignación autorizados.
- **Precondiciones:** pieza disponible, compatible, identificada y no asignada de forma incompatible; modalidad y proveedor definidos si el corte es externo.
- **Comportamiento esperado y resultado:** crea una asignación trazable sin cambiar propiedad; en la operación actual mantiene a Distripernos como propietario y puede trasladar custodia operativa a PROMED.
- **Reglas relacionadas:** propiedad y custodia son dimensiones distintas; ubicación no prueba ninguna; una pieza no puede quedar asignada simultáneamente a ejecuciones incompatibles.
- **Prioridad, fase y estado:** P1; primer incremento manual; modalidad, proveedor y evidencia concreta pendientes.
- **Fuente:** ADR 0005 y ADR 0009 propuesto; `PROD-030`–`PROD-035`, `PROD-040`, `PROD-041`; `CFG-013`, `CFG-014`.
- **Criterio de aceptación:** el traspaso de custodia no cambia propiedad y un conflicto concurrente de asignación se rechaza explícitamente.

#### FR-CUT-007 — Recepción y conciliación plan–real

- **Descripción:** recibir resultados y comparar solicitud, plan, ejecución, recepción y costo básico sin cerrar diferencias silenciosamente.
- **Actor o capacidad:** receptor y responsable de conciliación autorizados.
- **Precondiciones:** ejecución identificada, salidas y evidencia disponibles.
- **Comportamiento esperado y resultado:** la recepción registra cantidades, clases e identificación observadas. La conciliación compara plan frente a ejecución, solicitado frente a producido, material previsto frente a consumido y remanentes previstos frente a reales; conserva diferencias, causa, responsable, costo real básico, aprobación, cierre y pendiente futuro Migo aplicable.
- **Reglas relacionadas:** recepción no equivale a conciliación; cierre exige balance y autoridad; correcciones agregan eventos/revisiones.
- **Prioridad, fase y estado:** P1; primer incremento manual; formatos, eventos Migo y autoridades concretas pendientes.
- **Fuente:** ADR 0004, ADR 0005 y ADR 0009 propuesto; `PROD-037`–`PROD-042`; `LOG-Q-022`–`LOG-Q-025`, `LOG-Q-028`.
- **Criterio de aceptación:** una diferencia mantiene la ejecución pendiente de conciliación y solo una resolución autorizada permite cerrar.

#### FR-CUT-008 — Clasificación de salidas y pérdidas

- **Descripción:** clasificar cada salida como producto, remanente reutilizable, pérdida normal, pérdida extraordinaria o residuo.
- **Actor o capacidad:** ejecutor registra; receptor verifica; autoridad competente aprueba excepciones.
- **Precondiciones:** ejecución y mediciones válidas; reglas/configuración aplicables identificadas.
- **Comportamiento esperado y resultado:** cada cantidad pertenece a una clase y el balance explica el material de entrada; la merma extraordinaria queda bloqueada hasta aprobación.
- **Reglas relacionadas:** umbral temporal de remanente de 2 pulgadas sujeto a `CFG-015`; límites de pérdida sujetos a `CFG-016`; no reclasificación silenciosa.
- **Prioridad, fase y estado:** P1; primer incremento manual; clasificación definida y límites operativos pendientes.
- **Fuente:** ADR 0007 y ADR 0009 propuesto; `PROD-036`–`PROD-038`, `PROD-041`; `LOG-Q-017`, `LOG-Q-018`, `LOG-Q-022`; `CFG-015`, `CFG-016`.
- **Criterio de aceptación:** el balance conserva todas las clases y no permite cerrar una pérdida extraordinaria sin autoridad y evidencia.

#### FR-CUT-009 — Costo básico del incremento manual

- **Descripción:** registrar costo directo básico del material y del servicio de corte aplicable, sin inventar costos indirectos ni asientos contables.
- **Actor o capacidad:** actor de costos autorizado y conciliador.
- **Precondiciones:** fuente, moneda, vigencia, componentes permitidos y acceso restringido.
- **Comportamiento esperado y resultado:** el costo queda versionado y relacionado con solicitud, ejecución y conciliación; PROMED u otro documento externo se conserva como referencia/evidencia, no como significado supuesto.
- **Reglas relacionadas:** componentes iniciales limitados a los aprobados; visibilidad restringida; Migo conserva autoridad contable aplicable.
- **Prioridad, fase y estado:** P1; primer incremento manual; documento PROMED, eventos Migo y componentes concretos pendientes.
- **Fuente:** ADR 0004, ADR 0006 y ADR 0009 propuesto; `PROD-030`, `PROD-039`–`PROD-041`; `LOG-Q-023`, `LOG-Q-024`, `LOG-Q-026`; `CFG-017`.
- **Criterio de aceptación:** el total se reconstruye desde componentes autorizados y ningún costo indirecto no aprobado aparece en él.

#### FR-CUT-010 — Estados, bloqueo, cancelación y corrección

- **Descripción:** gobernar el ciclo funcional de solicitud, plan, asignación, ejecución, recepción y conciliación con estados y transiciones auditables.
- **Actor o capacidad:** actores autorizados por transición.
- **Precondiciones:** estado actual, versión, contexto e identificador idempotente válidos.
- **Comportamiento esperado y resultado:** una transición válida ocurre una vez; bloqueo, rechazo, sustitución, cancelación y corrección conservan causa, actor, tiempo y relación con el hecho previo.
- **Reglas relacionadas:** no edición silenciosa; concurrencia e idempotencia; estados detallados del ADR 0009 siguen propuestos.
- **Prioridad, fase y estado:** P1; primer incremento manual; propuesta revisable y autoridades concretas pendientes.
- **Fuente:** ADR 0009 propuesto, con ADR 0001 y ADR 0005; `PROD-034`, `PROD-038`, `PROD-041`, `PROD-042`; `LOG-Q-022`, `LOG-Q-028`.
- **Criterio de aceptación:** un reintento no duplica la transición y una corrección crea un hecho relacionado sin borrar el anterior.

### 15.6 Inventario externo, Servipernos y obligaciones

#### FR-EXT-001 — Fuente externa y estados de confianza

- **Descripción:** registrar `ExternalCounterparty`, `ExternalInventorySource` y estados observado, confirmado, reservado, entregado y vencido.
- **Actor o capacidad:** actor autorizado y contraparte/confirmante identificado.
- **Precondiciones:** fuente, actor, producto/mapeo, cantidad, tiempo, evidencia y vigencia.
- **Comportamiento esperado y resultado:** cada transición conserva confianza y fecha sin convertir disponibilidad en propiedad.
- **Reglas relacionadas:** stock externo excluido de ATP propio; modo manual/XLS inicial; integración no verificada.
- **Prioridad, fase y estado:** P1; MVP opcional; `BLOQUEADO_POR_EVIDENCIA` de acuerdo, formato, actor y vigencia.
- **Fuente:** ADR 0008, con ADR 0005 para separar ATP propio y ADR 0006 para abastecimiento; `PROD-022`, `PROD-023`; `IMP-Q-012`; `SUP-003`.
- **Criterio de aceptación:** una observación no permite reservar ni prometer como stock propio y una confirmación vencida deja de ser utilizable.

#### FR-EXT-002 — Entrega pendiente de clasificación

- **Descripción:** registrar recepción física o custodia sin inferir modalidad.
- **Actor o capacidad:** receptor autorizado y autoridad de clasificación por asignar.
- **Precondiciones:** evidencia de entrega, contraparte, cantidades y contexto.
- **Comportamiento esperado y resultado:** la entrega queda `PENDIENTE_CLASIFICACION` hasta contar con modalidad, autoridad y referencia suficientes.
- **Reglas relacionadas:** no propiedad propia, ATP, venta, consumo, corte, valoración, liquidación ni efecto contable inferido.
- **Prioridad, fase y estado:** P0 si inventario externo entra; MVP opcional sujeto a evidencia; pendiente.
- **Fuente:** ADR 0008, con ADR 0004 para efectos oficiales Migo y ADR 0005 para frontera con inventario propio; `PROD-022`, `PROD-023`; `ADR-Q-006`; `LOG-Q-009`, `LOG-Q-010`, `LOG-Q-015`.
- **Criterio de aceptación:** todos los intentos de uso prohibido se rechazan mientras la entrega permanezca sin clasificar.

#### FR-EXT-003 — Obligación y liquidaciones

- **Descripción:** preservar el registro conceptual de préstamo/obligación y agregar `LoanMovement` para liquidaciones.
- **Actor o capacidad:** actor autorizado y autoridad por modalidad pendiente.
- **Precondiciones:** contraparte, entidad, soporte, bienes/cantidades, propiedad declarada y modalidad aprobada.
- **Comportamiento esperado y resultado:** devolución, compra, venta, compensación o mezcla crean eventos; una parcial conserva saldo y una mixta conserva componentes.
- **Reglas relacionadas:** el nombre conceptual no acredita validez jurídica; no sobreliquidación; conciliación externa distinta de Migo.
- **Prioridad, fase y estado:** P1; posterior salvo decisión de MVP; confirmado funcionalmente con evidencia contractual/contable pendiente.
- **Fuente:** ADR 0008, con ADR 0004 para efectos oficiales Migo; `PROD-024`; `ADR-Q-006`; `LOG-Q-009`, `LOG-Q-015`.
- **Criterio de aceptación:** liquidar parcialmente no modifica el original ni produce saldo negativo y cada componente mantiene referencia.

### 15.7 Obras y operación de ANKLO

#### FR-OPS-001 — Clientes, proyectos, obras y órdenes

- **Descripción:** relacionar cliente, proyecto, obra, frente, ubicación y orden de trabajo bajo contexto organizacional.
- **Actor o capacidad:** administración de obra y actor operativo autorizado.
- **Precondiciones:** entidad responsable, cliente, alcance y documentos vigentes identificados.
- **Comportamiento esperado y resultado:** la orden delimita trabajo, responsables, estado, restricciones y referencias sin inferir entidad o contrato.
- **Reglas relacionadas:** organización y obra explícitas; revisiones; operaciones abiertas en transición requieren decisión.
- **Prioridad, fase y estado:** P1; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto organizacional; Bosquejo v1.1 §§5.2–5.4; `ADR-Q-005`; discovery C-004/C-005. ADR específico de obras pendiente antes de implementar la fase si una decisión arquitectónica adicional resulta necesaria.
- **Criterio de aceptación:** una orden no puede ejecutarse bajo otra entidad/obra y un cambio de alcance crea revisión o evento.

#### FR-OPS-002 — Cuadrillas, asistencia, herramientas y gastos

- **Descripción:** gestionar asignaciones, competencia, herramientas/activos, movimientos, asistencia/horas, gastos y viáticos.
- **Actor o capacidad:** actores de personal, obra, activos y administración autorizados.
- **Precondiciones:** finalidad, relación organizacional, obra, política y permisos aprobados.
- **Comportamiento esperado y resultado:** cada asignación o movimiento conserva vigencia, custodio, contexto y correcciones auditadas.
- **Reglas relacionadas:** datos mínimos; cálculo no equivale a pago legal; métricas no deciden disciplina o aptitud.
- **Prioridad, fase y estado:** P2; posterior; pendiente de políticas laborales y operativas.
- **Fuente:** ADR 0003 para contexto y autorización; Bosquejo v1.1 §§5.9–5.13; Manual v1.1 §§19–20; preguntas de discovery 58–63.
- **Criterio de aceptación:** corregir asistencia, custodia o gasto aprobado crea evento/reverso y no borra el original.

#### FR-OPS-003 — Parte diario y evidencia

- **Descripción:** registrar actividad, cuadrilla, materiales, herramientas, restricciones, incidencias, documentos y evidencias por obra.
- **Actor o capacidad:** técnico de campo y supervisor de obra autorizado.
- **Precondiciones:** orden, frente, tarea y revisión documental vigentes.
- **Comportamiento esperado y resultado:** el parte conserva datos estructurados, originales, derivados y estado de aprobación.
- **Reglas relacionadas:** GPS/foto complementarios; minimización; hash solo integridad; conectividad limitada pendiente.
- **Prioridad, fase y estado:** P1; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §§21–23; Bosquejo v1.1 §5.5; `IMP-Q-014`; discovery C-013/C-014.
- **Criterio de aceptación:** un derivado no sobrescribe el original y el informe indica revisión y fuentes utilizadas.

#### FR-OPS-004 — Ejecución técnica gobernada

- **Descripción:** registrar lo requerido, aprobado y ejecutado sin convertir el PRD en procedimiento de instalación.
- **Actor o capacidad:** técnico, supervisor, calidad y autoridad técnica competente.
- **Precondiciones:** contrato, plano, especificación, evaluación, MPII, procedimiento e ITP aplicables y vigentes.
- **Comportamiento esperado y resultado:** una discrepancia bloquea o escala; una autoridad competente registra la decisión y revisión.
- **Reglas relacionadas:** supervisor no rediseña; no parámetros por defecto; conversación verbal no cambia plano.
- **Prioridad, fase y estado:** P0 para seguridad del dominio; implementación posterior; confirmado como salvaguarda.
- **Fuente:** ADR 0003 para contexto; ADR 0005 únicamente cuando se registren consumos o movimientos; `PROD-021`, `PROD-027`; Manual v1.1 §§0–3, 11–12; discovery C-001/C-009/C-011.
- **Criterio de aceptación:** una combinación sin fuente aprobada no puede marcarse conforme ni recibir valores inventados.

#### FR-OPS-005 — Documentos y revisiones de obra

- **Descripción:** controlar metadatos, revisión, vigencia, distribución y relaciones de planos, RFI, procedimientos, ITP y entregables.
- **Actor o capacidad:** control documental y usuarios autorizados.
- **Precondiciones:** original recibido, fuente y alcance identificados.
- **Comportamiento esperado y resultado:** publicar una revisión no sobrescribe la anterior y alerta trabajo pendiente afectado.
- **Reglas relacionadas:** jerarquía documental; clasificación interno/cliente pendiente; aprobación autenticada distinta de firmas.
- **Prioridad, fase y estado:** P1; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto y autorización; Bosquejo v1.1 §5.3; Manual v1.1 §§0.2, 3, 23; discovery C-013/C-014.
- **Criterio de aceptación:** un registro histórico conserva la revisión que lo gobernó y un documento obsoleto no se selecciona sin advertencia/bloqueo aprobado.

### 15.8 Calidad

#### FR-QLT-001 — Inspecciones e ITP

- **Descripción:** gestionar planes de inspección, puntos Hold/Witness/Review, instrumentos, resultados y evidencia.
- **Actor o capacidad:** calidad y autoridades definidas por contrato/ITP.
- **Precondiciones:** ITP, criterio, muestra, instrumento y revisión aprobados.
- **Comportamiento esperado y resultado:** cada inspección conserva requisito, observación, resultado, autoridad y evidencia.
- **Reglas relacionadas:** no muestreo universal; inspección visual no demuestra capacidad; calibración vigente.
- **Prioridad, fase y estado:** P1; posterior; pendiente por obra/producto.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §11; Bosquejo v1.1 §5.6; discovery C-016.
- **Criterio de aceptación:** no se puede cerrar inspección sin criterio aplicable y el sistema no asigna un porcentaje por defecto.

#### FR-QLT-002 — NCR, disposición y cierre

- **Descripción:** gestionar NCR desde detección hasta verificación sin ocultar ni reescribir la desviación.
- **Actor o capacidad:** calidad y autoridades técnicas/contractuales competentes.
- **Precondiciones:** requisito, condición real, alcance y evidencia identificados.
- **Comportamiento esperado y resultado:** se conserva contención, análisis, disposición aprobada, acción, verificación y cierre.
- **Reglas relacionadas:** audiencia contractual pendiente; no reparación sin autoridad; originales preservados.
- **Prioridad, fase y estado:** P1; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §12; Bosquejo v1.1 §7.2; discovery C-013.
- **Criterio de aceptación:** una NCR no salta de abierta a cerrada y la disposición identifica la autoridad y la revisión afectada.

### 15.9 SST

#### FR-SST-001 — Riesgos, permisos y controles

- **Descripción:** registrar evaluación, permisos, inducciones, EPP, controles y vigencia por tarea/obra.
- **Actor o capacidad:** SST y responsables autorizados.
- **Precondiciones:** tarea, obra, riesgos, SDS y requisitos aplicables identificados.
- **Comportamiento esperado y resultado:** la liberación usa controles aprobados y registra pendientes/bloqueos.
- **Reglas relacionadas:** jerarquía de controles; EPP no universal; aplicabilidad normativa sujeta a análisis.
- **Prioridad, fase y estado:** P1; posterior; pendiente de matriz y políticas.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §13; Bosquejo v1.1 §5.7; discovery C-002/C-003.
- **Criterio de aceptación:** una lista genérica no declara cumplimiento y una tarea bloqueada no se libera sin autoridad.

#### FR-SST-002 — Incidencias y preservación

- **Descripción:** registrar observaciones, casi incidentes, incidentes, acciones y preservación extraordinaria.
- **Actor o capacidad:** cualquier reportante autorizado y SST.
- **Precondiciones:** evento, obra, tiempo y personas/datos mínimos identificados.
- **Comportamiento esperado y resultado:** se contiene, escala y preserva el expediente según política; las acciones mantienen seguimiento.
- **Reglas relacionadas:** no búsqueda automatizada de culpables; privacidad; no decisión médica o disciplinaria automática.
- **Prioridad, fase y estado:** P1; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §§13.4, 23.4; `PROD-027`.
- **Criterio de aceptación:** un incidente grave activa preservación sin alterar originales y ninguna métrica aplica sanción automática.

### 15.10 Auditoría y reportes

#### FR-AUD-001 — Auditoría append-only

- **Descripción:** registrar acciones críticas, cambios, rechazos, aprobaciones, delegaciones, importaciones y exportaciones.
- **Actor o capacidad:** servicios de aplicación y consulta auditada autorizada.
- **Precondiciones:** acción identificable y contexto de ejecución.
- **Comportamiento esperado y resultado:** `AuditEvent` conserva actor, acción, objeto, tiempo, contexto, correlación y motivo; una corrección agrega evento.
- **Reglas relacionadas:** append-only para interfaces ordinarias; auditoría no concede autoridad; hash no prueba verdad.
- **Prioridad, fase y estado:** P0; MVP obligatorio; confirmado funcionalmente.
- **Fuente:** AGENTS.md; ADR 0001 y ADR 0003 como bases transversales; ADR 0004–0008 solo para eventos auditados de su dominio; `PROD-010`, `PROD-026`, `PROD-027`.
- **Criterio de aceptación:** una acción sensible produce evento consultable y no existe interfaz ordinaria para editarlo o eliminarlo.

#### FR-AUD-002 — Evidencia y archivos

- **Descripción:** preservar originales fuera de la base relacional, con metadatos y derivados relacionados.
- **Actor o capacidad:** usuario autorizado y adaptador de archivos.
- **Precondiciones:** organización, finalidad, archivo, clasificación y permiso válidos.
- **Comportamiento esperado y resultado:** el original queda aislado; transformación, acceso y exportación quedan registrados.
- **Reglas relacionadas:** no bucket público; validación/antimalware productivo; retención pendiente; preservación extraordinaria.
- **Prioridad, fase y estado:** P1; MVP obligatorio para archivos de importación, posterior para campo; confirmado con configuración pendiente.
- **Fuente:** AGENTS.md; ADR 0001 y ADR 0003; Bosquejo v1.1 §§9–10; Manual v1.1 §23.
- **Criterio de aceptación:** una organización no accede a archivos de otra y un derivado mantiene referencia al original.

#### FR-RPT-001 — Reportes operativos esenciales

- **Descripción:** generar reportes de ATP, reservas, tareas Migo, diferencias y auditoría con autoridad y fecha visibles.
- **Actor o capacidad:** usuarios autorizados por contexto.
- **Precondiciones:** datos fuente disponibles y filtros permitidos.
- **Comportamiento esperado y resultado:** reporte reproducible etiqueta perspectiva, estado, periodo, entidad y revisión.
- **Reglas relacionadas:** protección de costos; datos aprobados; exportación auditada.
- **Prioridad, fase y estado:** P1; MVP obligatorio; confirmado funcionalmente.
- **Fuente:** ADR 0001 y ADR 0003 como bases; ADR 0004–0006 solo para métricas de Migo, inventario y comercio; `PROD-006`, `PROD-007`, `PROD-012`, `PROD-015`; Bosquejo v1.1 §5.15.
- **Criterio de aceptación:** un reporte ATP no se presenta como stock oficial y una exportación para vendedor omite costos.

#### FR-RPT-002 — Informes de obra y KPIs

- **Descripción:** producir partes diarios, informes semanales, dossier y KPIs desde datos aprobados.
- **Actor o capacidad:** obra, calidad y usuarios de reporte autorizados.
- **Precondiciones:** fuentes, revisión, plantilla y audiencia aprobadas.
- **Comportamiento esperado y resultado:** cada informe conserva datos, plantilla, versión, actor y fuentes; un cambio crea revisión.
- **Reglas relacionadas:** no editar PDF final; métricas no incentivan omisiones; metas pendientes de línea base.
- **Prioridad, fase y estado:** P2; posterior; parcialmente confirmado.
- **Fuente:** ADR 0003 para contexto y autorización; Manual v1.1 §§16, 23; Bosquejo v1.1 §§10–11.
- **Criterio de aceptación:** regenerar con las mismas fuentes/revisión reproduce el contenido y una corrección crea otra revisión.

## 16. Requisitos no funcionales

| ID           | Área              | Requisito verificable                                                                                                          | Medición o decisión pendiente                            | Fuente                                                                      |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| NFR-SEC-001  | Seguridad         | Autorizar en servidor toda lectura, mutación, exportación y cambio de contexto con denegación por defecto.                     | Cobertura de pruebas por capacidad y contexto.           | AGENTS; ADR 0003.                                                           |
| NFR-TEN-001  | Aislamiento       | Aislar datos y archivos por `BusinessGroup`, entidad y unidad; probar accesos cruzados negativos.                              | Estrategia RLS por definir al aprobar modelo lógico.     | ADR 0001; ADR 0003.                                                         |
| NFR-AUD-001  | Auditoría         | Mantener eventos append-only y correlación de operaciones críticas.                                                            | Periodo de retención por definir.                        | AGENTS; ADR 0001 y ADR 0003; ADR de dominio solo para su evento específico. |
| NFR-IDEM-001 | Idempotencia      | Usar identificadores de operación para importaciones, reservas, movimientos, confirmaciones y liquidaciones.                   | Claves concretas dependen de contratos de datos.         | ADR 0001 y ADR 0002; ADR 0004–0008 solo para operaciones de su dominio.     |
| NFR-CON-001  | Consistencia      | Mostrar estados de consistencia eventual y no confirmar efectos externos de forma optimista.                                   | Umbrales de alerta pendientes.                           | ADR 0004.                                                                   |
| NFR-TXN-001  | Transacciones     | Proteger invariantes concurrentes con transacciones breves y sin llamadas externas dentro de ellas.                            | Estrategia concreta se define en diseño.                 | AGENTS; ADR 0001; ADR 0005 para concurrencia de inventario/ATP.             |
| NFR-PERF-001 | Rendimiento       | Medir importación, consulta ATP, cotización y reportes con datos representativos antes de aprobar presupuestos de rendimiento. | Latencia, volumen y concurrencia por medir.              | Preguntas de implementación.                                                |
| NFR-AVL-001  | Disponibilidad    | Definir disponibilidad por canal y degradación segura cuando fallen Migo, archivos o red.                                      | SLA por analizar y aprobar.                              | Open questions; `SUP-001`.                                                  |
| NFR-DR-001   | Recuperación      | Mantener respaldos y ejecutar restauraciones verificadas de datos y archivos.                                                  | RTO y RPO por definir mediante análisis.                 | Bosquejo v1.1; open questions.                                              |
| NFR-MNT-001  | Mantenibilidad    | Conservar TypeScript estricto, monolito modular y dirección `web -> adaptadores -> puertos -> contratos`.                      | Métricas de modularidad se revisan por corte.            | ADR 0001–0002.                                                              |
| NFR-OBS-001  | Observabilidad    | Registrar logs estructurados, métricas y trazas con correlación, sin secretos ni datos excesivos.                              | Catálogo de alertas y retención pendiente.               | Bosquejo v1.1.                                                              |
| NFR-VAL-001  | Validación        | Tratar cliente, archivos e integraciones como entradas no confiables y validar en servidor.                                    | Límites de tipo/tamaño por definir.                      | AGENTS; ADR 0001 y ADR 0003; ADR 0004 para importaciones Migo.              |
| NFR-PRI-001  | Privacidad        | Aplicar finalidad, minimización, acceso necesario y evaluación de aplicabilidad antes de datos reales.                         | Inventario, retención y roles de tratamiento pendientes. | AGENTS; Manual/Bosquejo v1.1.                                               |
| NFR-FIL-001  | Archivos          | Preservar original, relacionar derivados, aislar acceso y aplicar controles de carga productiva.                               | Proveedor, tamaños, retención y preservación pendientes. | AGENTS; Bosquejo v1.1.                                                      |
| NFR-IMP-001  | Importaciones     | Conservar lote, archivo, mapeo, resultado por fila y errores de forma reproducible.                                            | Formatos y zonas horarias pendientes.                    | ADR 0004; `LOG-Q-001`.                                                      |
| NFR-ACC-001  | Accesibilidad     | Diseñar navegación por teclado, etiquetas, foco, contraste y mensajes comprensibles; verificar con pruebas.                    | Nivel y criterios formales por aprobar.                  | Dirección UX; buenas prácticas proporcionales.                              |
| NFR-RWD-001  | Responsive        | Soportar backoffice en escritorio/tableta y tareas de campo en móvil sin ocultar estados críticos.                             | Dispositivos/navegadores por investigar.                 | `IMP-Q-014`; Bosquejo v1.1.                                                 |
| NFR-MOB-001  | Conectividad      | El MVP conectado debe fallar de forma visible; offline se habilita solo tras definir escenarios, conflictos y seguridad local. | Alcance offline pendiente.                               | Open questions; discovery DEC-20.                                           |
| NFR-EXP-001  | Exportación       | Aplicar la misma autorización por campo/contexto y auditar cada exportación.                                                   | Formatos y audiencias por aprobar.                       | ADR 0003, ADR 0006.                                                         |
| NFR-TST-001  | Pruebas           | Probar contratos, reglas, aislamiento, concurrencia, idempotencia, estados e invariantes por corte vertical.                   | Cobertura cuantitativa por definir.                      | AGENTS; ADR 0001–0003; ADR de dominio solo para sus reglas específicas.     |
| NFR-DEV-001  | DevOps            | Mantener instalación reproducible, pnpm, validaciones CI, esquema válido y build antes de entregar código futuro.              | Estrategia de despliegue productivo pendiente.           | README; package.json.                                                       |
| NFR-INT-001  | Interoperabilidad | Aislar formatos/proveedores detrás de puertos y adaptadores; versionar contratos y mapeos.                                     | Capacidades reales de cada sistema pendientes.           | ADR 0002, ADR 0004, ADR 0008.                                               |

### 16.1 Aplicación al incremento manual de manufactura y corte

El incremento aplica, sin crear excepciones, `NFR-SEC-001`, `NFR-TEN-001`, `NFR-AUD-001`, `NFR-IDEM-001`, `NFR-TXN-001`, `NFR-VAL-001`, `NFR-PRI-001`, `NFR-FIL-001`, `NFR-ACC-001`, `NFR-RWD-001`, `NFR-MOB-001`, `NFR-TST-001` y `NFR-INT-001`. En particular, debe aislar solicitudes, piezas, planes, ejecuciones, recepciones, costos y evidencias por organización; validar cantidades, unidades, estados y transiciones en servidor; proteger la asignación concurrente; conservar eventos append-only; hacer idempotentes las confirmaciones; restringir costos por campo y contexto; y fallar de forma visible cuando no exista configuración o conectividad suficiente. Las metas cuantitativas y los formatos reales siguen pendientes y no se sustituyen por valores de desarrollo.

## 17. Reglas e invariantes

1. Una persona no accede a otra entidad por mera pertenencia al grupo.
2. Toda operación conserva entidad, unidad y contexto originales.
3. Una delegación vencida o revocada no autoriza acciones nuevas.
4. ANKLO-OS no emite una segunda factura tributaria.
5. Una referencia externa no prueba coincidencia ni conciliación.
6. Los lotes, snapshots, revisiones enviadas, movimientos originales y obligaciones originales no se sobrescriben.
7. El saldo operativo no se edita directamente; toda corrección usa reverso y nuevo movimiento.
8. ATP no es stock contable y conserva snapshot, fecha y componentes.
9. Un conteo no ajusta ni sustituye otra perspectiva por sí solo.
10. La misma persona no crea y aprueba un ajuste sensible salvo excepción expresa, justificada y auditada.
11. El vendedor no recibe costos ni márgenes.
12. Solo el dueño aprueba precios como autoridad permanente propuesta; una delegación válida es excepcional.
13. Una revisión enviada no cambia; una aceptada conserva precio y versión.
14. Registrar una oferta no equivale a aprobar precio ni confirmar disponibilidad.
15. La reserva firme inicial permanece hasta despacho o cancelación; cualquier expiración adicional exige política aprobada.
16. Un plan de corte no reserva ni modifica stock por sí mismo; solo la ejecución produce movimientos.
17. El corte comercial no modifica requisitos técnicos de obra.
18. El stock de Servipernos no es stock propio.
19. `PENDIENTE_CLASIFICACION` bloquea ATP, venta, consumo, corte, valoración, liquidación y efectos contables inferidos.
20. La IA no decide seguridad, conformidad técnica, disciplina, aptitud, pagos o derechos.
21. Propiedad, custodia, ubicación, posesión física y responsabilidad de ejecución son dimensiones distintas.
22. La solicitud, el plan, la asignación, la ejecución, la recepción y la conciliación son hechos distintos; ninguno acredita automáticamente al siguiente.
23. Una pieza no puede asignarse de forma concurrente a ejecuciones incompatibles.
24. Toda salida de una ejecución se clasifica como producto, remanente reutilizable, pérdida normal, pérdida extraordinaria o residuo, sin doble conteo.
25. El balance de ejecución explica el material de entrada dentro de la precisión aprobada; las diferencias permanecen visibles.
26. El umbral temporal de 2 pulgadas clasifica candidatos a remanente conforme a `CFG-015`; no define kerf, tolerancia ni aceptación técnica.
27. La aptitud de un remanente no se presume por longitud: depende de atributos, compatibilidad y condición aprobados.
28. Sin kerf y tolerancias aplicables aprobados, ningún plan se libera para ejecución productiva.
29. Una pérdida extraordinaria no se cierra sin autoridad, causa y evidencia conforme a límites aprobados.
30. El costo básico inicial solo incorpora material y servicio de corte aprobados; excluye costos indirectos y no crea por sí mismo un asiento ni documento oficial en Migo.
31. PROMED presta el servicio y puede recibir custodia operativa; no adquiere propiedad ni gobierna el inventario por ejecutar el corte.
32. Un cambio de custodia no implica necesariamente transporte físico; el evento registra únicamente el hecho respaldado.
33. Toda corrección conserva el hecho original y agrega evento, revisión o reverso relacionado.

## 18. Datos y autoridad de información

### 18.1 Definiciones de inventario

- **Snapshot:** observación inmutable de una fuente para fecha y granularidad identificadas.
- **Movimiento:** evento autorizado que explica un cambio operativo.
- **Saldo operativo proyectado:** resultado reconstruible de aplicar eventos confirmados sobre un snapshot válido.
- **ATP:** disponibilidad operativa para prometer; no existencia física ni saldo oficial.
- **Conteo:** observación física para alcance y momento determinados.
- **Ajuste:** movimiento autorizado que explica una diferencia; no edición de saldo.
- **Conciliación:** comparación de perspectivas/registros con coincidencia, diferencia y resolución trazables.

### 18.2 Matriz de fuentes de verdad

| Dato o proceso                  | Sistema oficial                            | Sistema operativo                    | Fuente                                | Fecha/estado                        | Conciliación                                |
| ------------------------------- | ------------------------------------------ | ------------------------------------ | ------------------------------------- | ----------------------------------- | ------------------------------------------- |
| Organización actual             | Evidencia societaria/fiscal aplicable      | ANKLO-OS                             | ADR 0003 y documentos ratificados     | Parcialmente ratificada             | Revisión documental; no inferencia.         |
| Catálogo por atributo           | Pendiente                                  | ANKLO-OS con mapeos                  | Migo/catálogo aprobado según atributo | `PENDIENTE_DEFINICION`              | Identificador, unidad y especificación.     |
| Stock contable Distripernos     | Migo                                       | Snapshot en ANKLO-OS                 | Exportación permitida                 | `OFICIAL_EXTERNA`                   | Lote, fecha, almacén, producto y cantidad.  |
| Stock operativo proyectado      | ANKLO-OS                                   | ANKLO-OS                             | Movimientos, reservas y pendientes    | `FUERTE_INTERNA`                    | Reconstrucción y comparación.               |
| Conteo físico                   | Realidad observada validada                | ANKLO-OS                             | Sesión/evidencia de conteo            | `FISICA_VALIDADA`                   | Comparación sin sobrescritura.              |
| ATP                             | ANKLO-OS como proyección                   | ANKLO-OS                             | Fórmula y política vigentes           | Dependencia externa visible         | Desglose y fecha.                           |
| Cotización/proforma             | ANKLO-OS para revisión enviada             | ANKLO-OS                             | `QuoteRevision`                       | `FUERTE_INTERNA`                    | Revisión aceptada contra pedido.            |
| Precio alternativo              | ANKLO-OS bajo política aprobada            | ANKLO-OS                             | Precio/política/versiones             | `FUERTE_INTERNA`                    | Entradas, regla y aprobación.               |
| Factura, nota de crédito y guía | Migo                                       | Referencia en ANKLO-OS               | Migo                                  | `OFICIAL_EXTERNA`                   | Entidad, periodo, importes y líneas.        |
| Compra/venta contable           | Migo                                       | Solicitud/tarea en ANKLO-OS          | Migo                                  | `EVENTUAL_CONCILIADA`               | Operación, recepción y referencias.         |
| Disponibilidad Servipernos      | Servipernos para su inventario             | Observación/confirmación en ANKLO-OS | Contraparte y evidencia               | `EXTERNA_CONFIRMADA` cuando aplique | Fuente, vigencia, producto y cantidad.      |
| Entrega externa                 | Soporte/modalidad aprobados                | ANKLO-OS                             | Evidencia de las partes               | Pendiente o eventual                | Propiedad, custodia, modalidad y documento. |
| Préstamo/obligación             | Soporte real; Migo para efectos aplicables | ANKLO-OS                             | Registro y movimientos                | `EVENTUAL_CONCILIADA`               | Saldo, componentes y referencias.           |
| Plan/ejecución de corte         | ANKLO-OS                                   | ANKLO-OS                             | Parámetros y ejecución aprobados      | `FUERTE_INTERNA`                    | Balance plan–real y genealogía.             |
| Documentos técnicos             | Fuente competente según tipo               | Repositorio controlado               | Contrato/plano/evaluación/MPII        | Revisión/vigencia                   | Identidad, revisión y aprobación.           |

## 19. Integraciones

### 19.1 Migo

- Canal inicial: carga manual y archivos XLS realmente permitidos.
- Capacidades no presumidas: API, webhooks, escritura automática, reserva externa, importaciones y anulaciones.
- Antes de recibir muestras autorizadas solo se permiten un contrato neutral y un adaptador ficticio o manual con datos ficticios para diseño y pruebas.
- Solo después de validar muestras y semántica reales podrá denominarse adaptador Migo validado o afirmarse compatibilidad con Migo.
- Cada integración validada usa adaptador, mapeo versionado, autenticación, idempotencia, errores y observabilidad propios.
- No se especifican columnas, hojas, claves, códigos, frecuencia, identificadores ni semántica hasta obtener muestras autorizadas.

### 19.2 Servipernos y otras contrapartes

- Canal inicial posible: registro manual verificado, XLS y confirmación humana.
- La autoridad, vigencia, formato y evidencia requieren acuerdo real.
- Una integración futura cambia el adaptador, no la propiedad ni los estados conceptuales.

### 19.3 Archivos, identidad y notificaciones

- Identidad, almacenamiento y notificaciones se consumen mediante capacidades; no se impone proveedor.
- Secretos permanecen fuera del repositorio.
- Fallos externos no deben mantener transacciones de negocio abiertas ni producir confirmaciones falsas.

## 20. Auditoría y trazabilidad

- Registrar actor autenticado, `ActingContext`, acción, objeto, resultado, timestamp y correlación.
- Auditar cambios de contexto, permisos, delegaciones, aprobaciones, reservas, movimientos, importaciones, conciliaciones, clasificaciones, liquidaciones y exportaciones.
- Conservar valores o revisiones antes/después cuando sea proporcional y permitido.
- Separar `AIInteraction` y `HumanReviewDecision` si se habilita IA.
- Preservar originales y metadatos; registrar toda transformación y acceso sensible.
- Permitir búsquedas por operación interna, referencia externa, entidad, periodo y estado sin convertir auditoría en fuente de autoridad.

## 21. Seguridad y privacidad

- Cuentas individuales, sesiones revocables y MFA para capacidades críticas cuando se apruebe proveedor/política.
- Autorización por entidad, unidad, acción, estado y campo; pruebas negativas obligatorias.
- Costos, márgenes, datos laborales, acuerdos y documentos de contraparte se clasifican como restringidos.
- Archivos no públicos, acceso temporal autorizado, validación de carga y controles antimalware antes de liberar contenido productivo.
- Fotografías y GPS solo con finalidad aprobada, minimización, alternativa cuando corresponda, acceso y retención definidos.
- No diseñar criptografía; usar capacidades de plataforma/proveedor aprobadas.
- No declarar aplicabilidad normativa sin análisis competente; aplicar controles proporcionales al riesgo.
- Suspender eliminación ante preservación extraordinaria autorizada.

## 22. UX y canales

### 22.1 Backoffice

- Menú lateral, pestañas, tablas, filtros, acciones visibles y formularios compactos.
- Contexto organizacional siempre visible en acciones sensibles.
- Estados, autoridad, fecha de dato, advertencias y pendientes visibles.
- Pocas animaciones; densidad funcional y accesibilidad antes que decoración.
- Vistas y exportaciones diferenciadas para evitar filtración de costos.

### 22.2 Campo y técnicos

- Experiencia móvil orientada a tareas, formularios simples, evidencias y estados claros.
- No mostrar éxito si la operación está local, en cola, rechazada o en conflicto.
- **Clasificación offline:** pregunta pendiente y fase posterior; el MVP base será conectado con fallos visibles. Un alcance offline limitado podrá entrar como opción de MVP solo después de validar dispositivos, conectividad, operaciones, conflictos y seguridad local.

## 23. Informes y KPIs

### 23.1 Informes MVP

- ATP y componentes por fecha/contexto.
- Reservas activas, vencidas, liberadas y consumidas.
- Tareas Migo por estado y antigüedad.
- Diferencias/conciliaciones abiertas y resueltas.
- Movimientos y reversos por producto/ubicación.
- Cotizaciones por estado, revisión y vigencia.
- Auditoría de acciones sensibles y exportaciones.

### 23.2 Informes del primer incremento manual de manufactura y corte

- Solicitudes, planes, asignaciones, ejecuciones, recepciones y conciliaciones por estado y antigüedad.
- Balance solicitud–plan–ejecución–recepción por pieza y genealogía.
- Producto, remanente, pérdida normal, pérdida extraordinaria y residuo con configuración aplicada.
- Propiedad, custodia, proveedor y ubicación sin mezclar inventario propio y externo.
- Costo directo básico y pendientes Migo, visibles solo para capacidades autorizadas.

### 23.3 Informes posteriores

- Parte diario, informe semanal y dossier de cierre.
- Optimización y comparación de algoritmos/patrones de corte.
- Exactitud de inventario, FPY, NCR, retrabajo, consumo y costo.
- PPC, restricciones, productividad normalizada, herramientas, certificados, SST y gastos.

Todo KPI identifica fuente, población, periodo y definición. No se fija meta numérica sin línea base; no se usa productividad para decidir automáticamente sobre personas.

## 24. MVP

### 24.1 Resultado del MVP

Demostrar un ciclo controlado desde contexto y cotización hasta reserva, inventario proyectado, orden interna, tarea Migo y conciliación, con auditoría y sin duplicar autoridad contable.

### 24.2 Matriz de alcance

| Capacidad                                                                   | MVP                                    | Posterior                  | Fuera de alcance                  | Preparación               | Justificación                                                                                                                       |
| --------------------------------------------------------------------------- | -------------------------------------- | -------------------------- | --------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Autenticación y sesión                                                      | Obligatorio                            | —                          | —                                 | `LISTO_PARA_DISENO`       | Base de toda autorización; el proveedor concreto permanece pendiente.                                                               |
| `BusinessGroup`, `LegalEntity`, `BusinessUnit`, membresía y `ActingContext` | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | El patrón está definido, pero entidades y membresías reales requieren evidencia.                                                    |
| Roles/capacidades mínimas y delegación de precio                            | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | La matriz real de autoridad y segregación debe ratificarse.                                                                         |
| Clientes y catálogo/mapeo mínimo                                            | Obligatorio sujeto a evidencia         | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Requiere catálogo aprobado, unidades, equivalencias y mapeos reales.                                                                |
| Importación manual de snapshot Migo                                         | Obligatorio sujeto a muestra permitida | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Solo pueden probarse contrato neutral y datos ficticios hasta validar muestras autorizadas.                                         |
| Movimientos, reversos y proyección                                          | Obligatorio                            | —                          | —                                 | `LISTO_PARA_DISENO`       | Sus invariantes conceptuales están definidas; el modelo lógico aún no se autoriza.                                                  |
| ATP, vigencia y política de degradación                                     | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | La fórmula está definida, pero la política de snapshot vencido debe aprobarse.                                                      |
| Cotización, revisiones y aceptación                                         | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Falta evidencia del evento, actor, canal y versión aceptada.                                                                        |
| Precio versionado, aprobación y visibilidad                                 | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | Reglas iniciales, permisos de costos y delegaciones requieren ratificación.                                                         |
| Reservas blandas y firmes                                                   | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | La política existe, pero extensiones, autoridades y operación inicial deben ratificarse.                                            |
| `SupplyRequest`                                                             | Obligatorio                            | —                          | —                                 | `LISTO_PARA_DISENO`       | Gestiona faltantes sin inventar disponibilidad.                                                                                     |
| `SupplierOffer`                                                             | Opcional sujeto a matriz/evidencia     | —                          | —                                 | `OPCIONAL`                | El actor concreto, permisos y fuentes permanecen pendientes.                                                                        |
| Pedido y orden de venta interna                                             | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Depende de evidencia de aceptación y del contrato de cola Migo.                                                                     |
| Cola Migo y conciliación básica                                             | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Requiere contratos documentales y coincidencias verificables.                                                                       |
| Conteo y diferencia básica                                                  | Obligatorio                            | —                          | —                                 | `BLOQUEADO_POR_DECISION`  | La captura es viable, pero validación y autoridad de cierre requieren matriz.                                                       |
| Ajuste sensible/cierre avanzado                                             | Opcional sujeto a matriz               | —                          | —                                 | `OPCIONAL`                | Autoridades, excepción y materialidad no están ratificadas.                                                                         |
| Auditoría y reportes esenciales                                             | Obligatorio                            | —                          | —                                 | `LISTO_PARA_DISENO`       | Existe base transversal; retención y audiencias siguen pendientes.                                                                  |
| Servipernos/stock externo                                                   | Opcional sujeto a acuerdo y formato    | —                          | —                                 | `BLOQUEADO_POR_EVIDENCIA` | Requiere acuerdo, propiedad/custodia, formato, actor y vigencia reales.                                                             |
| Préstamos y liquidaciones                                                   | —                                      | Sí                         | —                                 | `POSTERIOR`               | Requiere modalidades, soportes y tratamiento oficial.                                                                               |
| Piezas y registro manual de corte                                           | Inclusión general pendiente            | Primer incremento separado | —                                 | `LISTO_DOCUMENTALMENTE`   | Solicitud, plan manual, ejecución, recepción y conciliación están definidos; operación productiva exige parámetros y casos medidos. |
| Optimizador de cortes                                                       | —                                      | Sí                         | —                                 | `POSTERIOR`               | Parámetros, objetivo, algoritmo y benchmark pendientes.                                                                             |
| Obras y campo/anclajes                                                      | —                                      | Sí                         | —                                 | `POSTERIOR`               | Productos, flujo y autoridad técnica no están preparados.                                                                           |
| Calidad y NCR                                                               | —                                      | Sí                         | —                                 | `POSTERIOR`               | Depende de ITP, criterios y autoridades por obra.                                                                                   |
| SST                                                                         | —                                      | Sí                         | —                                 | `POSTERIOR`               | Depende de evaluación, permisos y revisión competente.                                                                              |
| Personal, herramientas, asistencia, gastos y viáticos                       | —                                      | Sí                         | —                                 | `POSTERIOR`               | Políticas operativas, laborales y de privacidad pendientes.                                                                         |
| Offline                                                                     | Opcional solo tras discovery           | Si no se justifica en MVP  | —                                 | `OPCIONAL`                | Dispositivos, navegadores, conflictos y tareas críticas no están confirmados.                                                       |
| Portal de cliente, BI, data warehouse                                       | —                                      | Sí                         | —                                 | `POSTERIOR`               | No necesario para validar el corte inicial.                                                                                         |
| IA/RAG                                                                      | —                                      | Sí                         | —                                 | `POSTERIOR`               | Depende de documentos aprobados, gobierno y revisión humana.                                                                        |
| Contabilidad propia, nómina legal y facturación electrónica propia          | —                                      | —                          | Sí, para el MVP y alcance inicial | `FUERA_DE_ALCANCE`        | Migo conserva la autoridad aplicable durante 2026.                                                                                  |

### 24.3 Primer corte vertical recomendado

El MVP representa la capacidad mínima de producto que valida el ciclo comercial-operativo completo. El primer corte vertical es una entrega técnica menor, demostrable y reversible; no se implementará todo el MVP en un único cambio.

Sujeto a las decisiones y evidencias verificadas, el primer corte podría limitarse a contexto organizacional mínimo, autorización básica, catálogo o fixture controlado, contrato neutral de snapshot, adaptador ficticio o manual con datos ficticios, consulta explicable de inventario/ATP, cotización en borrador y auditoría mínima.

Esta recomendación no autoriza implementación, tablas, endpoints ni diseño Prisma. La compatibilidad real con Migo solo podrá afirmarse después de probar muestras autorizadas y validar su contrato de datos.

### 24.4 Primer incremento manual de manufactura y corte

Este incremento se especifica como entrega separada y controlada; no resuelve por sí mismo `IMP-Q-016`, que mantiene pendiente su inclusión en el MVP general. Su alcance documental es solicitud, planificación manual determinista, aprobación, asignación con propiedad/custodia, ejecución interna o subcontratada, recepción, conciliación, clases de salida, costo directo básico, estados, auditoría y reportes esenciales. Excluye optimización automática, programación de máquinas, instrucciones técnicas de obra, costos indirectos no aprobados y automatización contable.

La línea base actual mantiene a Distripernos como entidad propietaria y administradora del inventario, a PROMED como proveedor externo que puede recibir custodia operativa sin adquirir propiedad y a ANKLO como brazo operativo de instalación que usa materiales administrados por Distripernos. El modelo admite una futura ANKLO independiente solo cuando exista evidencia y vigencia nuevas; no implementa hoy contabilidad multiempresa ni reatribuye historia.

El diseño puede comenzar contra contratos y datos ficticios, pero una ejecución productiva queda condicionada a catálogo/unidades, kerf, tolerancias, compatibilidad, casos reales, usuarios/capacidades, reglas de pérdida y formatos/evidencias aplicables. Los criterios verificables están en [Criterios de Aceptación de Manufactura y Corte — Incremento 1 v1.1](./acceptance/Criterios_Aceptacion_Manufactura_Corte_Incremento_1_v1.1.md).

### 24.5 Incremento 1B — trazabilidad visible y completitud del detalle de solicitudes de corte

**Estado de alcance:** aprobado funcionalmente por Israel para especificación e
implementación posterior. Esta decisión funcional no aprueba formalmente este
PRD, que permanece **BORRADOR**, ni cambia el estado **PROPUESTO** de los ADR
0007 y 0009.

**Objetivo y problema.** Completar la lectura de una solicitud de corte haciendo
visible su historial autorizado y, cuando exista, el motivo de cancelación. El
Incremento 1A ya conserva esos hechos en `AuditEvent`, pero el detalle actual no
los consulta ni presenta. La ausencia de esa lectura reduce la trazabilidad
observable y obliga a inspeccionar persistencia para reconstruir una transición.

**Alcance.** El incremento es exclusivamente informativo y comprende contratos
de salida mínimos, un puerto de lectura de historial, consulta de persistencia,
autorización, API de lectura, presentación en el detalle y pruebas. La solicitud
se sigue leyendo con `cut_request:read`; el historial y el motivo de cancelación
requieren además la capacidad separada `cut_request:read_history`.

**Capacidades y seguridad.** `cut_request:read` no concede por sí sola acceso al
historial. El servidor valida ambas capacidades y el alcance organizacional; la
interfaz no se usa como frontera de seguridad. Un actor autorizado para historial
puede recibir `actorReference`, una referencia técnica controlada que no equivale
a identidad humana verificada. No se inventan nombres, el UUID completo no se
presenta como elemento principal y no se exponen los snapshots `before`/`after`
completos ni campos ajenos al contrato mínimo.

**Auditoría y aislamiento.** La lectura se deriva de eventos append-only y no
modifica el registro auditado. Toda consulta conserva `organization_id` en el
servicio y en persistencia, opera bajo la política RLS aplicable y no revela si
existe una solicitud o evento de otra organización. La presentación distingue
acción, fecha, referencia técnica del actor y motivo permitido sin afirmar
autoría humana, verdad material o validez jurídica.

**Limitaciones y datos maestros.** Los únicos estados continúan siendo `DRAFT`,
`SUBMITTED` y `CANCELLED`; no se agregan transiciones posteriores a `SUBMITTED`
ni comandos de escritura. `MM` continúa como configuración ficticia temporal,
prioridad continúa como texto y `requiredAt` conserva su semántica actual. No se
incorpora `committedAt`, catálogo productivo, precisión, escala, conversión o
redondeo. Producción continúa fallando cerrada sin identidad real.

**Fuera de alcance.** Revisión, aprobación, rechazo, bloqueo, reapertura,
asignación, planificación, ejecución, inventario, costos, integración con Migo,
optimizador y cualquier efecto físico u operativo. El incremento no altera
`FR-CUT-004`: completa la consulta de la solicitud existente sin convertirla en
plan. Tampoco amplía las transiciones de `FR-CUT-010` ni modifica la regla
append-only de `FR-AUD-001`.

**Persistencia y dependencia técnica.** La inspección del Incremento 1A confirma
que `AuditEvent` ya conserva organización, actor técnico, acción, fecha, estado
anterior/posterior, motivo y correlación bajo RLS. Por ello no se prevé migración;
si la implementación descubre un dato indispensable ausente, debe detenerse y
volver a decisión documental en vez de ampliar el esquema por inferencia.

**Criterios de aceptación.** La aceptación funcional se verifica mediante
`AC-CUT-1B-001`–`AC-CUT-1B-012` en el documento de criterios del Incremento 1.
Debe demostrarse lectura básica sin historial, acceso autorizado al historial y
motivo, denegaciones por capacidad y organización, minimización de actor y datos,
orden estable, ausencia de mutaciones y ausencia de migración.

**Dependencias futuras.** La identidad productiva, el mapeo de referencias
técnicas a identidades verificadas y sus reglas de presentación requieren una
decisión posterior. También permanecen pendientes el catálogo productivo de
unidades y las políticas de precisión, escala, conversión y redondeo; ninguna
impide especificar esta lectura, pero sí impide presentarlas como aprobadas.

## 25. Fases posteriores

Las fases expresan dependencia y orden relativo; no constituyen fechas, promesas comerciales ni compromisos de entrega.

| Fase                     | Resultado buscado                                                             | Capacidades candidatas                                                                                | Condición de entrada                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1. Consolidación del MVP | Estabilizar el ciclo comercial, ATP, inventario, reservas y coexistencia Migo | Reglas configurables, conciliación ampliada, mejores reportes y operación sostenida                   | MVP validado funcionalmente, métricas de uso y pendientes críticos resueltos                                                        |
| 2. Taller y terceros     | Controlar transformación física y relaciones con inventario externo           | Incremento manual de manufactura/corte; después, optimización, Servipernos, préstamos y liquidaciones | Para diseño manual: PRD y criterios revisados. Para uso productivo: catálogo real, parámetros medidos, casos y acuerdos/evidencias. |
| 3. Obras y campo         | Llevar el control operacional a obra sin sustituir autoridad técnica          | Proyectos, frentes, anchors, partes, evidencias, calidad, SST, activos, personal y gastos             | Flujos por obra, ITP, permisos, autoridades y política de privacidad aprobados                                                      |
| 4. Analítica y canales   | Ampliar explotación y acceso controlado                                       | BI, data warehouse, portal de cliente y conectividad limitada/offline avanzada                        | Definiciones de KPI, arquitectura de datos, dispositivos y escenarios de conectividad verificados                                   |
| 5. Asistencia con IA     | Apoyar consulta y preparación sin decisiones autónomas                        | Búsqueda asistida, RAG, extracción y borradores                                                       | Documentos aprobados, gobierno de datos, evaluación, revisión humana y límites de uso                                               |

## 26. Dependencias

### 26.1 Dependencias de producto y gobierno

- Aprobación del presente PRD y ratificación de los ADR que gobiernan el MVP.
- Matriz de autoridad y segregación revisada por acción, no inferida de cargos nominales.
- Definición de identidad, membresías, delegaciones y contexto organizacional.
- Catálogo mínimo, unidades, códigos, compatibilidades y mapeo hacia Migo.
- Muestras autorizadas de exportación Migo y reglas de corrección, vigencia y conciliación.
- Contrato de datos Migo validado antes de afirmar compatibilidad; mientras tanto solo contrato neutral, adaptador ficticio/manual y datos ficticios.
- Política aprobada de ATP, reservas, aceptación de cotización y evidencias.
- Criterios observables y evidencia de aceptación para cada capacidad que ingrese al MVP.
- Acuerdo, formato y responsabilidades de Servipernos si esa capacidad ingresa al MVP.
- Casos medidos, parámetros y método de validación si cortes ingresa al MVP.
- Revisión de seguridad, privacidad, retención, archivos y continuidad.

### 26.2 Dependencias técnicas sin diseño de implementación

- Los contratos compartidos preceden a adaptadores y composición.
- El dominio depende de contratos y expone puertos; la persistencia actúa como adaptador.
- La aplicación web compone dominio, persistencia y UI sin invertir dependencias.
- El modelo lógico y las migraciones funcionales esperan las decisiones de datos bloqueantes.
- Los adaptadores de archivos e identidad, y el futuro adaptador Migo una vez validado, deben poder evolucionar sin trasladar detalles externos al dominio.

## 27. Supuestos

Los siguientes son exclusivamente los supuestos registrados en la fuente de pendientes; no sustituyen evidencia ni autorización. La autoridad de Migo durante 2026 es una decisión `PROD-006`, no un supuesto. El alcance offline se trata mediante `IMP-Q-014`, no mediante un ID nuevo.

| ID      | Supuesto registrado                                                                                        | Clasificación     | Tratamiento                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| SUP-001 | Migo no ofrece inicialmente API utilizable, webhooks, reserva externa ni escritura automática.             | Supuesto temporal | Diseñar integración XLS/manual y puertos sustituibles; revisar al obtener evidencia técnica de Migo.   |
| SUP-002 | Las importaciones autorizadas se originarán inicialmente en archivos XLS conservados como originales.      | Supuesto temporal | Confirmar formatos, semántica, periodicidad, permisos y correcciones con las primeras muestras reales. |
| SUP-003 | No existe todavía una integración utilizable verificada con Servipernos.                                   | Supuesto temporal | Mantener modo híbrido detrás de adaptadores y no presentar inventario externo como propio.             |
| SUP-004 | ANKLO seguirá siendo unidad operativa de Distripernos hasta que exista evidencia legal de la futura S.A.S. | Supuesto temporal | Conservar atribución actual y revisar al recibir documentos constitutivos/fiscales.                    |

## 28. Preguntas abiertas

La clasificación indica el punto más temprano afectado. Los textos siguientes conservan el significado del registro v2.0; no reutilizan IDs para preguntas distintas.

| ID                                                    | Clasificación                             | Pregunta verificada                                                                                         | Impacto si permanece abierta                                                                      |
| ----------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ADR-Q-001                                             | Bloquea aprobación del PRD/ADR            | ¿Qué identificador y denominación tendrá `BusinessGroup` y qué entidades legales iniciales le pertenecen?   | Impide poblar la organización real como hecho aprobado.                                           |
| ADR-Q-002                                             | Bloquea aprobación del PRD/ADR            | ¿Qué fuente gobierna cada atributo del catálogo?                                                            | Impide cerrar catálogo, mapeos y enriquecimiento operativo.                                       |
| ADR-Q-003                                             | Bloquea aprobación del PRD/ADR            | ¿Qué autoridad real tienen las listas de precios que mantenga Migo?                                         | Impide atribuir autoridad no aprobada a precios externos.                                         |
| ADR-Q-004                                             | Bloquea aprobación del PRD/ADR            | ¿Qué almacenes, ubicaciones y dimensiones de stock reconoce Migo y cómo se corresponden con las operativas? | Impide definir correctamente snapshot y conciliación.                                             |
| ADR-Q-005                                             | Bloquea aprobación del PRD/ADR            | ¿Qué operaciones abiertas podrán transferirse a una futura ANKLO S.A.S.?                                    | Impide cerrar la transición organizacional temporal.                                              |
| ADR-Q-006                                             | Bloquea aprobación del PRD/ADR            | ¿Qué efectos de operaciones con Servipernos deben registrarse obligatoriamente en Migo?                     | Impide cerrar frontera operativa, contractual y contable.                                         |
| LOG-Q-001                                             | Bloquea modelo lógico                     | ¿Cuál es la estructura exacta de cada XLS de Migo?                                                          | Bloquea contrato de importación, parser y tipos reales.                                           |
| LOG-Q-002                                             | Bloquea modelo lógico                     | ¿Qué identificadores estables ofrece Migo?                                                                  | Bloquea mapeos e idempotencia semántica.                                                          |
| LOG-Q-003                                             | Bloquea modelo lógico                     | ¿Cómo representa Migo correcciones, anulaciones, reemplazos y reemisiones?                                  | Bloquea reversos, tareas y conciliación.                                                          |
| LOG-Q-004                                             | Bloquea modelo lógico                     | ¿Qué campos podrán importarse para cada documento o proceso oficial?                                        | Bloquea referencias externas y contratos de cola.                                                 |
| LOG-Q-005                                             | Bloquea modelo lógico                     | ¿Cada XLS contiene saldos, movimientos o ambos, y qué fecha tiene autoridad?                                | Bloquea la semántica del snapshot.                                                                |
| LOG-Q-006                                             | Bloquea modelo lógico                     | ¿Qué combinación identifica un lote y una fila sin depender solo del hash?                                  | Bloquea idempotencia de importación.                                                              |
| LOG-Q-008                                             | Bloquea modelo lógico                     | ¿Cómo se tratarán operaciones abiertas durante la transición a ANKLO S.A.S.?                                | Afecta referencias temporales y atribución histórica.                                             |
| LOG-Q-009                                             | Bloquea modelo lógico                     | ¿Cuál es la documentación contractual y comercial vigente con Servipernos?                                  | Bloquea contraparte, propiedad, custodia y modalidad.                                             |
| LOG-Q-010                                             | Bloquea modelo lógico                     | ¿Qué formato, actor y vigencia tendrá una confirmación o reserva de Servipernos?                            | Bloquea estados de confianza externos.                                                            |
| LOG-Q-011                                             | Bloquea modelo lógico                     | ¿Cuál es el catálogo real, incluidas unidades, equivalencias, lotes y especificaciones?                     | Bloquea catálogo mínimo y compatibilidad de piezas.                                               |
| LOG-Q-012                                             | Bloquea modelo lógico                     | ¿Qué precisión, conversiones y redondeos aplican a cantidades, longitudes, costos y precios?                | Bloquea valores de dominio.                                                                       |
| LOG-Q-013                                             | Bloquea modelo lógico                     | ¿Qué tipos de almacén existen y qué movimientos admite cada uno?                                            | Bloquea granularidad, propiedad y ATP.                                                            |
| LOG-Q-014                                             | Bloquea modelo lógico                     | ¿Qué constituye una diferencia material para exigir cierre por autoridad competente?                        | Bloquea materialidad; la autoridad nominal histórica permanece desplazada por ADR 0005 corregido. |
| LOG-Q-015                                             | Bloquea modelo lógico                     | ¿Qué datos y documentos son obligatorios para cada modalidad y liquidación externa?                         | Bloquea préstamos y liquidaciones.                                                                |
| LOG-Q-016                                             | Bloquea modelo lógico posterior           | ¿Cuál es el ancho de corte por máquina/proceso y su vigencia?                                               | Bloquea cortes, no el MVP comercial.                                                              |
| LOG-Q-017                                             | Bloquea modelo lógico posterior           | ¿Qué pérdidas aplican por proceso?                                                                          | Bloquea merma y conciliación plan–real.                                                           |
| LOG-Q-018                                             | Bloquea modelo lógico posterior           | ¿Cuál es la longitud mínima reutilizable por producto/especificación?                                       | Bloquea remanentes.                                                                               |
| LOG-Q-019                                             | Bloquea modelo lógico posterior           | ¿Qué atributos determinan compatibilidad entre barra, pieza, remanente y solicitud?                         | Bloquea reglas de corte.                                                                          |
| LOG-Q-020                                             | Bloquea modelo lógico                     | ¿Qué cuarentenas y bloqueos afectan ATP y quién puede liberarlos?                                           | Bloquea eventos completos de ATP.                                                                 |
| LOG-Q-021                                             | Bloquea operación productiva de corte     | ¿Qué tolerancias aplican por producto, proceso, máquina y especificación, y con qué vigencia?               | Permite diseñar el contrato, pero impide liberar planes productivos sin valores aprobados.        |
| LOG-Q-022                                             | Bloquea cierre de pérdidas                | ¿Qué límites y autoridades distinguen pérdida normal de extraordinaria?                                     | Impide aprobar excepciones y cerrar conciliaciones extraordinarias.                               |
| LOG-Q-023                                             | Bloquea evidencia/costo externo           | ¿Qué documento o evento real representa PROMED y qué campos/autoridad tiene?                                | Impide atribuir significado documental o contable al término.                                     |
| LOG-Q-024                                             | Bloquea conciliación Migo                 | ¿Qué eventos de manufactura/corte deben registrarse o referenciarse en Migo?                                | Impide cerrar la frontera y automatizar tareas externas.                                          |
| LOG-Q-025                                             | Bloquea conciliación real                 | ¿Qué formatos y coincidencias se usarán para recepción y conciliación?                                      | Permite un contrato neutral, pero no afirmar compatibilidad con el proceso real.                  |
| LOG-Q-026                                             | Bloquea costo ampliado                    | ¿Qué costos indirectos podrían incorporarse en fases futuras y bajo qué autoridad?                          | Mantiene el incremento limitado a costos directos básicos aprobados.                              |
| LOG-Q-027                                             | Bloquea validación con realidad           | ¿Qué casos reales, anonimizados y autorizados validarán solicitud, plan, ejecución y conciliación?          | Impide validar operación productiva y parámetros representativos.                                 |
| LOG-Q-028                                             | Bloquea asignación productiva             | ¿Qué usuarios reales ejercerán cada capacidad y qué segregaciones/excepciones aplican?                      | Impide habilitar transiciones sensibles para usuarios reales.                                     |
| IMP-Q-001                                             | Bloquea implementación                    | ¿Qué muestra XLS permitida y anonimizada se usará como fixture inicial?                                     | Bloquea validación real del adaptador Migo; no bloquea pruebas con datos ficticios.               |
| IMP-Q-002                                             | Bloquea implementación                    | ¿Qué hacer cuando el snapshot esté ausente o vencido?                                                       | Bloquea la política de degradación de ATP.                                                        |
| IMP-Q-003                                             | Bloquea implementación                    | ¿Qué precisión de stock verá cada rol y contexto?                                                           | Bloquea respuestas y autorización por campo.                                                      |
| IMP-Q-005                                             | Bloquea implementación                    | ¿Qué roles reales corresponden a los cargos históricos?                                                     | Bloquea matriz de autoridad y actor concreto de `SupplierOffer`.                                  |
| IMP-Q-006                                             | Bloquea implementación                    | ¿Qué reglas iniciales de pricing deben cargarse?                                                            | Bloquea configuración comercial inicial.                                                          |
| IMP-Q-007                                             | Bloquea implementación                    | ¿Qué evento constituye aceptación de cotización y qué evidencia se conserva?                                | Bloquea cotización a pedido.                                                                      |
| IMP-Q-008                                             | Bloquea implementación                    | ¿Qué evento confirma una salida o aprueba un ingreso para afectar ATP?                                      | Bloquea componentes operativos de ATP.                                                            |
| IMP-Q-009                                             | Bloquea implementación                    | ¿Qué campos mínimos requiere una tarea Migo y qué impide duplicarla?                                        | Bloquea contrato de cola.                                                                         |
| IMP-Q-010                                             | Bloquea implementación                    | ¿Qué coincidencia permite conciliación automática?                                                          | Bloquea cierre exacto y casos negativos.                                                          |
| IMP-Q-011                                             | Bloquea implementación                    | ¿Cómo se registra y revoca una excepción a la segregación de ajustes?                                       | Bloquea ajustes sensibles.                                                                        |
| IMP-Q-012                                             | Bloquea implementación posterior/opcional | ¿Qué canal y evidencia confirman inicialmente stock de Servipernos?                                         | Bloquea esa capacidad opcional.                                                                   |
| IMP-Q-013                                             | Bloquea implementación posterior          | ¿Qué objetivo y desempate usará el optimizador?                                                             | Bloquea el optimizador de cortes.                                                                 |
| IMP-Q-014                                             | Bloquea implementación                    | ¿Qué dispositivos, navegadores y escenarios offline debe soportar la interfaz móvil?                        | Determina si offline entra al MVP o permanece posterior.                                          |
| IMP-Q-015                                             | Bloquea implementación                    | ¿Qué datos personales y técnicos puede mostrar cada informe/exportación?                                    | Bloquea autorización y minimización de reportes.                                                  |
| IMP-Q-016                                             | Bloquea decisión de alcance               | ¿El incremento manual de manufactura y corte forma parte del MVP general o de una entrega separada?         | No impide especificarlo; impide presentarlo como alcance ratificado del MVP general.              |
| CFG-001                                               | Decisión configurable                     | ¿Cómo se presenta la cantidad de stock por rol/contexto?                                                    | Determina visibilidad, no vigencia del snapshot.                                                  |
| CFG-005                                               | Decisión configurable                     | ¿Qué plazos, tipos y excepciones de reserva aplican?                                                        | Determina reservas blandas y firmes.                                                              |
| CFG-008                                               | Decisión configurable posterior/opcional  | ¿Qué vigencia tiene una observación o confirmación externa?                                                 | Determina caducidad de disponibilidad externa.                                                    |
| CFG-009                                               | Decisión configurable                     | ¿Qué materialidad aplica a diferencias?                                                                     | Determina escalamiento y cierre.                                                                  |
| CFG-010                                               | Decisión configurable                     | ¿Qué permisos explícitos permiten ver costos?                                                               | Determina prevención de filtración; no se infiere por cargo.                                      |
| CFG-011                                               | Decisión configurable                     | ¿Qué alcance, vigencia y límites tiene una delegación de precio?                                            | Determina autorización temporal.                                                                  |
| CFG-013                                               | Decisión configurable de corte            | ¿Qué modalidad interna/externa y qué proveedor aplican a cada ejecución?                                    | Determina ejecución y custodia sin cambiar propiedad por inferencia.                              |
| CFG-014                                               | Decisión configurable de corte            | ¿Qué esquema de identificación se aplica a piezas y resultados?                                             | Implementa la identificación híbrida sin inventar etiquetas reales.                               |
| CFG-015                                               | Decisión configurable de corte            | ¿Se ratifica o cambia el umbral temporal de 2 pulgadas para remanentes?                                     | Determina clasificación; no sustituye kerf ni tolerancia.                                         |
| CFG-016                                               | Decisión configurable de corte            | ¿Qué reglas y límites aprobados aplican a pérdidas normales y extraordinarias?                              | Determina clasificación, escalamiento y cierre.                                                   |
| CFG-017                                               | Decisión configurable de costo            | ¿Qué componentes directos aprobados integran el costo básico?                                               | Determina cálculo y visibilidad sin crear contabilidad propia.                                    |
| Pendiente de verificación, sin ID en el registro v2.0 | Bloquea implementación                    | ¿Qué RTO y RPO resultan del análisis de impacto y riesgo?                                                   | Debe registrarse antes de atribuirle un ID o fijar cifras.                                        |

## 29. Riesgos

| ID      | Riesgo y causa                                                             | Impacto                                          | Control propuesto                                                                    | Propietario de decisión                            | Estado                                            |
| ------- | -------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| RSK-001 | Doble registro por operar sin correlación entre ANKLO-OS y Migo            | Saldos o tareas inconsistentes                   | Clave de origen, idempotencia, cola visible y conciliación                           | Por asignar                                        | Abierto                                           |
| RSK-002 | Doble facturación por interpretar una orden interna como documento oficial | Afectación contable, tributaria y comercial      | Etiquetas inequívocas, prohibición de factura propia y referencia al documento Migo  | Autoridad funcional por ratificar                  | Abierto                                           |
| RSK-003 | Sobrepromesa por ATP incompleto, concurrencia o reservas omitidas          | Incumplimiento al cliente                        | Cálculo central, bloqueo transaccional, reservas y estado de vigencia visible        | Por asignar                                        | Abierto                                           |
| RSK-004 | Snapshot vencido usado como disponibilidad actual                          | Promesa o compra basada en datos obsoletos       | Antigüedad visible y política aprobada de advertencia, degradación o bloqueo         | Por asignar                                        | Abierto; bloquea aprobación                       |
| RSK-005 | Importación duplicada o reintentada sin idempotencia                       | Doble efecto operacional                         | Huella de archivo/lote/fila, resultado repetible y originales preservados            | Por asignar                                        | Abierto                                           |
| RSK-006 | Errores de mapeo de códigos, unidades o ubicaciones                        | Inventario y conciliación incorrectos            | Mapeos versionados, cuarentena y revisión de excepciones                             | Por asignar                                        | Abierto                                           |
| RSK-007 | Permisos cruzados o cambio de contexto que eleva privilegios               | Exposición o modificación entre organizaciones   | Verificación de membresía/capacidad en servidor, aislamiento y pruebas negativas     | Por asignar                                        | Abierto                                           |
| RSK-008 | Filtración de costos a respuestas o actores no autorizados                 | Pérdida comercial y de confidencialidad          | Contratos de salida mínimos y autorización específica de costos                      | Por asignar                                        | Abierto                                           |
| RSK-009 | Delegación vencida todavía utilizable                                      | Aprobación de precio fuera de autoridad          | Validez temporal, comprobación al ejecutar y auditoría                               | Por asignar                                        | Abierto                                           |
| RSK-010 | Reservas huérfanas por flujo interrumpido o vencimiento no tratado         | Disponibilidad artificialmente reducida          | Estados explícitos, liberación idempotente, alertas y conciliación                   | Por asignar                                        | Abierto                                           |
| RSK-011 | Inventario externo presentado como propio                                  | Promesa falsa y disputa de propiedad             | Dimensiones obligatorias de propiedad/custodia y vistas separadas                    | Por asignar                                        | Abierto                                           |
| RSK-012 | Préstamos mal clasificados o sin saldo parcial                             | Diferencias con tercero y Migo                   | Modalidad explícita, movimientos relacionados y balance verificable                  | Por asignar                                        | Abierto; fase posterior                           |
| RSK-013 | Merma no registrada durante ejecución                                      | Existencia inflada y costo incompleto            | Registro y balance de todas las clases de salida antes del cierre                    | Por asignar                                        | Abierto; aplica al incremento manual              |
| RSK-014 | Corte calculado con parámetros supuestos o falsos                          | Pérdida material o instrucción insegura          | Bloqueo sin kerf/tolerancias aprobados, parámetros versionados y validación humana   | Autoridad técnica por asignar                      | Abierto; bloquea operación productiva             |
| RSK-015 | Reatribución histórica al cambiar entidad, código o responsable            | Auditoría engañosa                               | Contexto y referencias históricas inmutables; corrección mediante eventos/revisiones | Por asignar                                        | Abierto                                           |
| RSK-016 | Dependencia excesiva de formatos o disponibilidad de Migo                  | Interrupción y alto costo de cambio              | Adaptador aislado, importación observable, originales y procedimientos manuales      | Por asignar                                        | Abierto                                           |
| RSK-017 | MVP demasiado amplio por incorporar toda la visión                         | Retraso y validación tardía de valor             | Matriz de alcance, criterios de entrada y cambios aprobados                          | Israel y Christian, sujetos a ratificación del PRD | Abierto; bloquea aprobación                       |
| RSK-018 | Reaparición de requisitos antiguos que contradicen ADR corregidos          | Autoridad ambigua y comportamiento inconsistente | Jerarquía de fuentes, trazabilidad y registro explícito de contradicciones           | Por asignar                                        | Mitigado en este borrador; ratificación pendiente |

## 30. Criterios de aceptación del PRD y del producto

Los escenarios canónicos y detallados del primer incremento manual están en [Criterios de Aceptación de Manufactura y Corte — Incremento 1 v1.1](./acceptance/Criterios_Aceptacion_Manufactura_Corte_Incremento_1_v1.1.md). Los casos `AC-009` y `AC-010` siguientes se conservan como criterios generales históricos; para manufactura/corte se verifican mediante `AC-MC-001`–`AC-MC-028`.

### 30.1 Criterios para aceptar este PRD

- **PRD-AC-001 — Completitud:** contiene las 32 secciones, matrices internas, alcance, requisitos, riesgos, preguntas y condiciones solicitadas.
- **PRD-AC-002 — Trazabilidad:** los requisitos importantes se relacionan con ADR, decisiones, preguntas o supuestos sin copiar extensamente las fuentes.
- **PRD-AC-003 — Gobierno:** aplica la jerarquía documental, conserva las contradicciones históricas y deja autoridades concretas pendientes cuando no están ratificadas.
- **PRD-AC-004 — No invención:** no fija parámetros técnicos, jurídicos, operativos, RTO/RPO/SLA, algoritmos ni permisos sin evidencia.
- **PRD-AC-005 — MVP controlado:** distingue con justificación lo obligatorio, lo opcional sujeto a evidencia, lo posterior y lo excluido.
- **PRD-AC-006 — Verificabilidad:** cada requisito funcional incluye un resultado o criterio observable y no prescribe pruebas de código.

### 30.2 Escenarios observables de aceptación del producto

| ID     | Escenario                                                                          | Resultado esperado                                                                                                        |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Un usuario solicita datos de una entidad para la que no tiene membresía/capacidad. | El servidor rechaza la operación y no revela datos de esa entidad.                                                        |
| AC-002 | Un usuario cambia de `ActingContext`.                                              | Solo cambian el ámbito y las capacidades ya autorizadas; el cambio no eleva privilegios y queda auditado.                 |
| AC-003 | Se modifica precio o contenido después de enviar una cotización.                   | Se crea una nueva revisión; la enviada conserva contenido, precio, vigencia y evidencia originales.                       |
| AC-004 | Un vendedor consulta una cotización sin capacidad de costos.                       | La respuesta no contiene costo ni campos que permitan inferirlo directamente.                                             |
| AC-005 | Dos solicitudes concurrentes intentan reservar la misma disponibilidad.            | El total confirmado no excede la disponibilidad válida; una solicitud recibe resultado explícito de conflicto o faltante. |
| AC-006 | Se reimporta el mismo archivo/lote Migo.                                           | No se duplican efectos y el sistema informa que el origen ya fue procesado.                                               |
| AC-007 | Un conteo físico difiere de la proyección.                                         | Se registra la observación/diferencia sin sobrescribir el saldo ni crear ajuste silencioso.                               |
| AC-008 | Una persona escribe una referencia Migo sin evidencia conciliable.                 | La tarea no se marca automáticamente como conciliada.                                                                     |
| AC-009 | Se guarda o aprueba un plan de corte.                                              | El inventario no cambia hasta registrar la ejecución física autorizada.                                                   |
| AC-010 | Se ejecuta un corte posterior con parámetros aprobados.                            | Se relacionan consumo, piezas, remanente y merma sin mutar el movimiento original.                                        |
| AC-011 | Se consulta disponibilidad propia y de Servipernos.                                | Propiedad y custodia permanecen visibles; el stock externo no aparece como propio.                                        |
| AC-012 | Se devuelve o liquida parcialmente un préstamo.                                    | El balance pendiente se conserva y puede trazarse a sus movimientos y soportes.                                           |
| AC-013 | Se intenta entregar inventario externo sin modalidad o clasificación requerida.    | La entrega queda bloqueada y se informa el dato/evidencia faltante.                                                       |
| AC-014 | Se intenta aprobar precio con una delegación vencida.                              | La acción se rechaza y el intento queda auditado.                                                                         |
| AC-015 | El snapshot supera la vigencia configurada.                                        | La interfaz muestra antigüedad y aplica la política aprobada sin presentar el ATP como actual.                            |
| AC-016 | Se acepta una cotización y se genera el paso hacia Migo.                           | ANKLO-OS crea pedido/orden interna y tarea correlacionada, pero no una segunda factura oficial.                           |
| AC-017 | Se revierte un movimiento o se corrige un dato aprobado.                           | Se añade un evento o revisión relacionada; el hecho original permanece disponible.                                        |
| AC-018 | Se exportan datos sensibles.                                                       | Se valida capacidad y contexto, se minimizan campos y se audita actor, alcance y resultado.                               |
| AC-019 | Falla una llamada o importación externa dentro de un flujo de negocio.             | La transacción local no queda abierta durante la espera y el resultado pendiente/error es visible y recuperable.          |
| AC-020 | Un dispositivo pierde conectividad en el MVP conectado.                            | No confirma una operación no persistida; muestra el fallo y permite recuperación segura según el alcance aprobado.        |

## 31. Trazabilidad a ADR y decisiones

### 31.1 Matriz de trazabilidad

| Requisito/capacidad                                             | ADR aplicable                                                                                                                                             | Decisión provisional                                       | Pregunta, configuración o supuesto                                                                                                                                             | Criterio de aceptación                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| FR-ORG-001–003 — contexto, membresía y capacidades              | Principal: ADR 0003. Soporte técnico: ADR 0001 y ADR 0002.                                                                                                | `PROD-003`–`PROD-005`                                      | `ADR-Q-001`, `LOG-Q-007`, `LOG-Q-008`, `IMP-Q-004`, `IMP-Q-005`, `SUP-004`                                                                                                     | AC-001, AC-002                        |
| FR-MIGO-001–004 — importación, cola y conciliación              | Principal: ADR 0004. Soporte: ADR 0002 para adaptadores y ADR 0003 para atribución.                                                                       | `PROD-002`, `PROD-006`, `PROD-008`–`PROD-010`, `PROD-014`  | `ADR-Q-002`–`ADR-Q-004`, `LOG-Q-001`–`LOG-Q-006`, `IMP-Q-001`, `IMP-Q-009`, `IMP-Q-010`, `SUP-001`, `SUP-002`                                                                  | AC-006, AC-008, AC-016, AC-019        |
| FR-INV-001–005 — movimientos, conteo, ATP y reservas            | Principal: ADR 0005. Soporte: ADR 0004 para snapshot/cola y ADR 0006 para reservas comerciales.                                                           | `PROD-007`, `PROD-010`–`PROD-013`, `PROD-019`              | `ADR-Q-004`, `LOG-Q-005`, `LOG-Q-006`, `LOG-Q-013`, `LOG-Q-014`, `LOG-Q-020`, `IMP-Q-002`, `IMP-Q-003`, `IMP-Q-008`, `IMP-Q-010`, `IMP-Q-011`, `CFG-001`, `CFG-005`, `CFG-009` | AC-005, AC-007, AC-015, AC-017        |
| FR-COM-001–006 — cotización, precio, abastecimiento y orden     | Principal: ADR 0006. Soporte: ADR 0005 para ATP/reservas, ADR 0004 para orden/cola y ADR 0003 para permisos.                                              | `PROD-014`–`PROD-019`                                      | `ADR-Q-002`, `ADR-Q-003`, `LOG-Q-011`, `LOG-Q-012`, `IMP-Q-003`, `IMP-Q-005`–`IMP-Q-007`, `CFG-001`–`CFG-005`, `CFG-010`, `CFG-011`                                            | AC-003, AC-004, AC-014, AC-016        |
| FR-CUT-001–010 — manufactura y corte manual                     | Principal: ADR 0009 propuesto. Soporte: ADR 0005 para inventario; ADR 0006 para costo/servicio; ADR 0007 para piezas y planificación; ADR 0004 para Migo. | `PROD-028`–`PROD-042`                                      | `LOG-Q-011`, `LOG-Q-012`, `LOG-Q-016`–`LOG-Q-019`, `LOG-Q-021`–`LOG-Q-028`, `IMP-Q-013`, `IMP-Q-016`, `CFG-006`, `CFG-007`, `CFG-013`–`CFG-017`                                | AC-009, AC-010; AC-MC-001–AC-MC-028   |
| Incremento 1B — lectura de historial de solicitudes de corte    | ADR 0001 y ADR 0003 para seguridad/aislamiento; ADR 0009 permanece propuesto y no se amplía.                                                              | `PROD-043`                                                 | Identidad productiva, asignaciones reales y catálogo/unidades continúan pendientes; no se prevé migración.                                                                     | AC-CUT-1B-001–AC-CUT-1B-012           |
| FR-EXT-001–003 — stock externo y préstamos                      | Principal: ADR 0008. Soporte: ADR 0005 para frontera propia, ADR 0006 para abastecimiento y ADR 0004 para efectos Migo.                                   | `PROD-022`, `PROD-023`, `PROD-024`                         | `ADR-Q-006`, `LOG-Q-009`, `LOG-Q-010`, `LOG-Q-015`, `IMP-Q-012`, `CFG-008`, `SUP-003`                                                                                          | AC-011–AC-013                         |
| FR-OPS-001–005 — obras y operación de campo                     | ADR 0003 para contexto; ADR 0005 solo para consumos/movimientos. ADR específico pendiente si la fase exige una decisión adicional.                        | `PROD-021`, `PROD-027`; documentos canónicos de campo      | `ADR-Q-005`, `LOG-Q-008`, `IMP-Q-014`; preguntas operativas/técnicas de discovery                                                                                              | AC definidos antes de ingresar a fase |
| FR-QLT-001–002 y FR-SST-001–002                                 | ADR 0003 para contexto/autorización; base funcional en Manual, Bosquejo y fuentes técnicas aplicables.                                                    | Salvaguardas canónicas; sin autoridad final atribuida      | ITP, criterios, permisos y revisión competente por definir                                                                                                                     | AC definidos antes de ingresar a fase |
| FR-AUD-001–002 — auditoría, evidencia y archivos                | ADR 0001 y ADR 0003; ADR 0004–0008 solo cuando se audita una regla específica del dominio.                                                                | `PROD-004`, `PROD-005`, `PROD-010`, `PROD-026`, `PROD-027` | `IMP-Q-015`; privacidad, retención y preservación pendientes                                                                                                                   | AC-002, AC-014, AC-017, AC-018        |
| FR-RPT-001–002 — reportes operativos                            | ADR 0001 y ADR 0003; ADR 0004–0006 solo para datos de Migo, inventario o comercio.                                                                        | `PROD-006`, `PROD-007`, `PROD-012`, `PROD-015`, `PROD-025` | `IMP-Q-003`, `IMP-Q-015`; definiciones y líneas base por medir                                                                                                                 | AC-015, AC-016                        |
| NFR-SEC-001, NFR-TEN-001, NFR-PRI-001, NFR-VAL-001              | ADR 0001 y ADR 0003; documentos canónicos de seguridad/privacidad.                                                                                        | `PROD-003`–`PROD-005`, `PROD-026`                          | `IMP-Q-004`, `IMP-Q-005`, `IMP-Q-015`                                                                                                                                          | AC-001, AC-002, AC-004, AC-018        |
| NFR-IDEM-001, NFR-CON-001, NFR-TXN-001, NFR-IMP-001             | ADR 0001 y ADR 0002; ADR 0004–0008 solo para operaciones de su dominio.                                                                                   | `PROD-006`–`PROD-014`, `PROD-019`, `PROD-022`–`PROD-024`   | `LOG-Q-001`–`LOG-Q-006`, `IMP-Q-001`, `SUP-001`, `SUP-002`                                                                                                                     | AC-005–AC-008, AC-019                 |
| NFR-AVL-001, NFR-DR-001, NFR-PERF-001, NFR-OBS-001              | ADR 0001 y Bosquejo v1.1.                                                                                                                                 | Sin cifra ratificada                                       | RTO/RPO pendientes de verificación y registro; medición/análisis pendientes                                                                                                    | AC-019, AC-020                        |
| NFR-FIL-001, NFR-EXP-001, NFR-ACC-001, NFR-RWD-001, NFR-MOB-001 | ADR 0001 y ADR 0003; Manual/Bosquejo v1.1.                                                                                                                | `PROD-025`, principios de evidencia y privacidad           | `IMP-Q-014`, `IMP-Q-015`; retención y conectividad pendientes                                                                                                                  | AC-018, AC-020                        |
| NFR-MNT-001, NFR-TST-001, NFR-DEV-001, NFR-INT-001              | ADR 0001 y ADR 0002; ADR 0004/0008 solo para sus adaptadores externos.                                                                                    | `PROD-008`, `PROD-009`, `PROD-023`, `PROD-026`             | `LOG-Q-001`, `LOG-Q-009`, `IMP-Q-001`, `IMP-Q-012`, `SUP-001`, `SUP-003`                                                                                                       | AC-006, AC-019                        |

### 31.2 Contradicciones gobernadas

Los ADR 0003–0009 en su versión vigente y estado documental indicado gobiernan este PRD frente a formulaciones nominales anteriores. La fuente desplazada se conserva como historial; no se reescribe como si nunca hubiera existido. Las autoridades concretas siguen pendientes de una matriz o de evidencia ratificada.

| Contradicción                                                                                                        | Regla gobernante                                                                                                               | Tratamiento en este PRD                                                           |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `PROD-013` atribuía conciliación y ajustes a cargos nominales frente al ADR 0005 corregido.                          | Las aprobaciones se asignan por capacidad, alcance, vigencia y segregación.                                                    | Se usa una matriz neutral y no se presupone que un cargo cierre por sí solo.      |
| `PROD-015` permitía inferir autoridad/costos desde “superadministrador” o “supervisor” frente al ADR 0006 corregido. | Ningún rol nominal otorga autoridad comercial universal ni acceso automático a costos.                                         | El acceso a costos y la aprobación de precio exigen capacidades explícitas.       |
| `PROD-016` fijaba actores nominales para `SupplierOffer` frente al ADR 0006 corregido.                               | Los actores se determinan mediante matriz de autoridad y segregación.                                                          | `SupplierOffer` queda opcional y su actor concreto permanece abierto.             |
| `PROD-019` fijaba efectos de reserva firme frente al ADR 0006 corregido.                                             | La reserva firme mantiene la regla inicial documentada; cualquier expiración o autoridad adicional requiere política aprobada. | Se conserva el comportamiento inicial visible y se usa `CFG-005` para cambios.    |
| `PROD-014` enumeraba compras/devoluciones como tipos documentales frente al ADR 0004 corregido.                      | Son procesos y registros de negocio; el tipo exacto de documento depende de evidencia Migo.                                    | Se modelan efectos, referencias y conciliación sin inventar documentos oficiales. |

### 31.3 Fuentes documentales principales

- [Bosquejo de Arquitectura ERP ANKLO-OS v1.1](../../ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md)
- [Manual Maestro de Supervisión de Anclajes v1.1](../../ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md)
- [Resumen Maestro del Proyecto v1.1](../../ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md)
- [Mapa de fuente de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md)
- [Registro de decisiones de producto](./decisions/Registro_Decisiones_Producto_v2.0.md)
- [Preguntas pendientes](./decisions/Preguntas_Supuestos_Pendientes_v2.0.md)
- [Criterios de Aceptación de Manufactura y Corte — Incremento 1 v1.1](./acceptance/Criterios_Aceptacion_Manufactura_Corte_Incremento_1_v1.1.md)
- ADR 0001–0009 en `docs/adr/`, con prevalencia de las correcciones vigentes de 0003–0009 y sin cambiar su estado propuesto.

## 32. Condiciones para pasar de BORRADOR a APROBADO

Este documento permanece en estado **BORRADOR** hasta que exista evidencia verificable de las siguientes condiciones:

### 32.1 Autoridades de revisión y ratificación

- **Israel:** realiza la revisión integral y otorga, cuando corresponda, la aprobación funcional y documental del PRD.
- **Christian:** ratifica las decisiones de negocio, el alcance y exclusiones del MVP, y la autoridad de precios y reglas comerciales que sean de su competencia.
- **Contabilidad:** valida la frontera con Migo, los registros oficiales, la conciliación y los efectos contables aplicables.
- **Responsables competentes:** revisan técnica de anclajes, SST, privacidad y asuntos jurídicos o laborales cuando correspondan.

Ninguna persona ratifica automáticamente materias fuera de su competencia. Estas revisiones no constituyen por sí mismas aprobación jurídica, contable, tributaria, laboral, de SST, de privacidad o técnica fuera del alcance acreditado de cada responsable.

### 32.2 Condiciones verificables

1. Israel completa la revisión integral, registra correcciones o conformidad y aprueba funcional y documentalmente esta versión.
2. Christian ratifica las decisiones de negocio, el alcance y exclusiones del MVP y las reglas comerciales que le correspondan.
3. Contabilidad valida los límites de autoridad e intercambio con Migo durante 2026, los registros oficiales y los criterios de conciliación/efectos contables aplicables.
4. Se resuelven las contradicciones que bloquean aprobación y se conserva el tratamiento histórico.
5. La matriz provisional de autoridad, segregación, costos y delegaciones queda revisada por las autoridades competentes.
6. Se dispone de evidencia mínima autorizada de las exportaciones Migo que alimentarán el MVP.
7. Se aprueba la política de snapshot/ATP vencido y su comportamiento visible.
8. Se aporta evidencia del flujo real de cotización, envío, aceptación, rechazo y vencimiento.
9. Se decide expresamente la inclusión o exclusión de Servipernos en el MVP; si se incluye, se aporta acuerdo y formato mínimo.
10. Se decide expresamente la inclusión o exclusión de cortes en el MVP; si se incluye, se aportan casos y parámetros medidos.
11. Los responsables competentes completan las revisiones aplicables de técnica de anclajes, SST, seguridad, privacidad, asuntos jurídicos y laborales sin convertirlas en aprobaciones automáticas fuera de su competencia.
12. La trazabilidad de los requisitos importantes está completa y no existen decisiones atribuidas sin respaldo.
13. La revisión confirma ausencia de requisitos, permisos, parámetros, cifras o documentos oficiales inventados.
14. Los pendientes no bloqueantes quedan registrados con clasificación y fase, sin exigir cerrar todas las preguntas de implementación para aprobar el PRD.
15. Los criterios `AC-MC-001`–`AC-MC-028` y sus dependencias se revisan antes de programar el incremento manual; los escenarios productivos bloqueados no se habilitan sin evidencia/configuración aprobada.
